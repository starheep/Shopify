from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

from myapp.Models.Product_Explorer import Offer
from myapp.Models.Chatbot import ChatMessage, ChatSession, UserAPIKey

from myapp.Confidential.Keys import GEMINI_API_KEY, GROQ_API_KEY
from myapp.Confidential.LLM import GEMINI_MODEL, GROQ_MODEL

from myapp.Tools.AI_Tools import global_rag_search, create_smart_kit, clone_project_for_user, add_vendor_inventory

import json

from google import genai
from google.genai import types
from groq import Groq




# JSON Schema strictly for Groq (Google GenAI will use the native Python functions)
GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "global_rag_search",
            "description": "Searches the database for Products, Student Projects, and Local Vendors/Shops. ALWAYS use this to look up vendor details, shop reviews, project ideas, or hardware components.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_query": {"type": "string"},
                    "domain_filter": {"type": "string", "enum": ["all", "product", "project", "vendor"]}
                },
                "required": ["search_query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_smart_kit",
            "description": "Creates a new project kit and adds components to it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_username": {"type": "string"},
                    "kit_name": {"type": "string"},
                    "component_names": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["user_username", "kit_name", "component_names"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "clone_project_for_user",
            "description": "Clones an existing community project.",
            "parameters": {
                "type": "object",
                "properties": {"user_username": {"type": "string"}, "project_id": {"type": "integer"}},
                "required": ["user_username", "project_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_vendor_inventory",
            "description": "Adds or updates a product offer in a vendor's local store.",
            "parameters": {
                "type": "object",
                "properties": {
                    "vendor_name": {"type": "string"}, "product_name": {"type": "string"},
                    "category": {"type": "string"}, "price": {"type": "number"}, "stock": {"type": "integer"}
                },
                "required": ["vendor_name", "product_name", "category", "price", "stock"]
            }
        }
    }
]

class ChatbotView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    # To load chat history AND session lists
    def get(self, request):
        session_id = request.query_params.get('session_id')
        
        # If NO session ID is provided, return a list of all their past chats for the Sidebar
        if not session_id:
            sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')
            session_data = []
            for s in sessions:
                session_data.append({
                    "id": str(s.id), 
                    "title": s.title, 
                    "updated_at": s.updated_at.strftime("%b %d, %I:%M %p")
                })
            return Response({"sessions": session_data})
            
        # If a session ID IS provided, return the actual messages for that chat
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
            messages = session.messages.order_by('created_at')
            history = []
            for msg in messages:
                history.append({
                    "id": msg.id,
                    "role": "model" if msg.role in ["model", "assistant"] else "user",
                    "text": msg.text,
                })
            return Response({"messages": history})
        except ChatSession.DoesNotExist:
            return Response({"messages": []})

    def post(self, request):
        user = request.user
        user_message = request.data.get('message', '')
        session_id = request.data.get('session_id')
        
        # Config & BYOK
        ai_config = request.data.get('ai_config', {})
        provider = ai_config.get('provider', 'gemini')
        custom_key = ai_config.get('custom_key')
        
        user_keys, _ = UserAPIKey.objects.get_or_create(user=user)
        if provider == 'gemini':
            api_key = custom_key if custom_key else (user_keys.gemini_key or GEMINI_API_KEY)
            model_name = GEMINI_MODEL
        else:
            api_key = custom_key if custom_key else (user_keys.groq_key or GROQ_API_KEY)
            model_name = GROQ_MODEL

        # Identify Role
        is_vendor = False
        vendor_name = None
        vendor_inventory_context = "You are not managing a store."
        if hasattr(user, 'vendor_profile') and user.vendor_profile.is_approved:
            is_vendor = True
            vendor_name = user.vendor_profile.vendor_name
            offers = Offer.objects.filter(vendor=vendor_name)
            if offers.exists():
                vendor_inventory_context = ", ".join([f"{o.product.name} (₹{o.price})" for o in offers])

        system_instruction = f"""
        You are an expert AI Lab Assistant for 'The Tech ShopWay'. User: {user.username}. Vendor? {is_vendor}. (Vendor Name: {vendor_name}).
        SELLER HUB: {vendor_inventory_context}
        
        Rules:
        1. ALWAYS use `global_rag_search` to find database products/reviews.
        2. CRITICAL UI RULE: If you are listing, recommending, or showing ANY products from the database, you MUST output ONLY valid JSON wrapped in ```json markdown tags.
        3. NO CHITCHAT: Do NOT include any conversational text (like "Here is the list...") before or after the JSON block.
        4. EXACT SCHEMA: The JSON "type" MUST be exactly "product_recommendation" so the frontend UI can render it. Do NOT use "product_list".
        
        Strict Format Required:
        ```json
        {{
          "type": "product_recommendation", 
          "message": "Here are the products you requested:", 
          "products": [{{"id": 1, "name": "Item", "category": "Cat", "estimated_price": "₹10"}}]
        }}
        ```
        """

        # Load Session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=user)
            except ChatSession.DoesNotExist:
                return Response({"error": "Session not found"}, status=404)
        else:
            session = ChatSession.objects.create(user=user, title=user_message[:30])

        ChatMessage.objects.create(session=session, role='user', text=user_message)
        
        # ==========================================
        #         GOOGLE GENAI PIPELINE
        # ==========================================
        if provider == 'gemini':
            try:
                client = genai.Client(api_key=api_key)
                
                # Format native Google History
                gemini_history = []
                for msg in session.messages.exclude(text__exact=user_message).order_by('created_at'):
                    role = "user" if msg.role == "user" else "model"
                    if msg.text:
                        gemini_history.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))
                
                allowed_tools = [global_rag_search, create_smart_kit, clone_project_for_user]
                if is_vendor: allowed_tools.append(add_vendor_inventory)

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=allowed_tools,
                    temperature=0.2
                )
                
                chat = client.chats.create(model=model_name, config=config, history=gemini_history)
                response = chat.send_message(user_message)

                # GEMINI Agent Loop
                if response.function_calls:
                    fc = response.function_calls[0]
                    args = fc.args
                    
                    if fc.name == "global_rag_search": reply = global_rag_search(args.get("search_query", ""), args.get("domain_filter", "all"))
                    elif fc.name == "create_smart_kit": reply = create_smart_kit(user.username, args.get("kit_name"), args.get("component_names", []))
                    elif fc.name == "clone_project_for_user": reply = clone_project_for_user(user.username, args.get("project_id"))
                    elif fc.name == "add_vendor_inventory": reply = add_vendor_inventory(vendor_name, args.get("product_name"), args.get("category", "Electronics"), float(args.get("price", 0)), int(args.get("stock", 0)))
                    
                    # Feed the response back to Gemini so it reads the RAG data naturally
                    second_response = chat.send_message(
                        types.Part.from_function_response(name=fc.name, response={"result": reply})
                    )
                    final_text = second_response.text
                else:
                    final_text = response.text

                ChatMessage.objects.create(session=session, role='model', text=final_text)
                return Response({"reply": final_text, "session_id": session.id})

            except Exception as e:
                print(f"Gemini Error: {e}")
                return Response({"reply": "Google API Error. Ensure you have valid keys.", "session_id": session.id}, status=500)

        # ==========================================
        #           GROQ PIPELINE
        # ==========================================
        else:
            try:
                client = Groq(api_key=api_key)
                
                # Format native Groq History
                groq_messages = [{"role": "system", "content": system_instruction}]
                for msg in session.messages.exclude(text__exact=user_message).order_by('created_at'):
                    role = "user" if msg.role == "user" else "assistant"
                    if msg.text:
                        groq_messages.append({"role": role, "content": msg.text})
                
                groq_messages.append({"role": "user", "content": user_message})
                
                allowed_groq_tools = [GROQ_TOOLS[0], GROQ_TOOLS[1], GROQ_TOOLS[2]]
                if is_vendor: allowed_groq_tools.append(GROQ_TOOLS[3])

                response = client.chat.completions.create(
                    model=model_name,
                    messages=groq_messages,
                    tools=allowed_groq_tools,
                    tool_choice="auto",
                    temperature=0.2
                )
                
                response_msg = response.choices[0].message
                
                # NATIVE GROQ AGENT LOOP
                if response_msg.tool_calls:
                    tc = response_msg.tool_calls[0]
                    args = json.loads(tc.function.arguments)
                    
                    if tc.function.name == "global_rag_search": reply = global_rag_search(args.get("search_query", ""), args.get("domain_filter", "all"))
                    elif tc.function.name == "create_smart_kit": reply = create_smart_kit(user.username, args.get("kit_name"), args.get("component_names", []))
                    elif tc.function.name == "clone_project_for_user": reply = clone_project_for_user(user.username, args.get("project_id"))
                    elif tc.function.name == "add_vendor_inventory": reply = add_vendor_inventory(vendor_name, args.get("product_name"), args.get("category", "Electronics"), float(args.get("price", 0)), int(args.get("stock", 0)))
                    
                    groq_messages.append(response_msg)
                    groq_messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": tc.function.name,
                        "content": reply
                    })
                    
                    second_response = client.chat.completions.create(model=model_name, messages=groq_messages)
                    final_text = second_response.choices[0].message.content
                else:
                    final_text = response_msg.content

                ChatMessage.objects.create(session=session, role='model', text=final_text)
                return Response({"reply": final_text, "session_id": session.id})

            except Exception as e:
                print(f"Groq Error: {e}")
                return Response({"reply": "Groq API Error. Check your API settings.", "session_id": session.id}, status=500)
