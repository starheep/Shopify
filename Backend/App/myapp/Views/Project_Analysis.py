from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from myapp.Models.Chatbot import UserAPIKey

from myapp.Confidential.Keys import GEMINI_API_KEY, GROQ_API_KEY
from myapp.Confidential.LLM import GEMINI_MODEL, GROQ_MODEL

import json

from google import genai
from google.genai import types
from groq import Groq


class AnalyzeProjectView(APIView):
    # Allow anyone to analyze, but we'll try to get their keys if they are logged in
    permission_classes = [AllowAny] 

    def post(self, request):
        project_idea = request.data.get('idea', '')
        analysis_type = request.data.get('type', 'FEASIBILITY')
        
        # Config & BYOK Routing
        ai_config = request.data.get('ai_config', {})
        provider = ai_config.get('provider', 'gemini')
        custom_key = ai_config.get('custom_key')
        
        # Fetch user keys if they are logged in, otherwise fallback to system defaults
        if request.user.is_authenticated:
            user_keys, _ = UserAPIKey.objects.get_or_create(user=request.user)
            if provider == 'gemini':
                api_key = custom_key if custom_key else (user_keys.gemini_key or GEMINI_API_KEY)
            else:
                api_key = custom_key if custom_key else (user_keys.groq_key or GROQ_API_KEY)
        else:
            api_key = custom_key if custom_key else (GEMINI_API_KEY if provider == 'gemini' else GROQ_API_KEY)

        # Use the highly reliable models
        model_name = GEMINI_MODEL if provider == 'gemini' else GROQ_MODEL

        # Strict JSON Prompt
        prompt = f"""
        Perform a {analysis_type} analysis for this student engineering project: "{project_idea}".
        CRITICAL RULE: You MUST return ONLY valid JSON. No conversational text before or after.
        The JSON must match this exact structure:
        {{
            "title": "Project Title",
            "summary": "A clear 2-sentence summary...",
            "overallScore": 85,
            "marketOutlook": "Positive",
            "estimatedTimeline": "3-4 weeks",
            "riskLevel": "Low",
            "metrics": [
                {{"label": "Innovation", "value": 90, "comment": "Highly unique."}},
                {{"label": "Feasibility", "value": 80, "comment": "Doable with available parts."}}
            ],
            "keyPoints": [
                {{"type": "strength", "text": "Uses accessible components."}},
                {{"type": "weakness", "text": "Requires complex coding."}}
            ]
        }}
        """
        
        try:
            # ==========================================
            #        GOOGLE GENAI PIPELINE
            # ==========================================
            if provider == 'gemini':
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.2)
                )
                raw_text = response.text

            # ==========================================
            #           GROQ PIPELINE
            # ==========================================
            else:
                client = Groq(api_key=api_key)
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    # 👇 THIS IS MAGIC: It forces Groq to output 100% valid JSON, guaranteed.
                    response_format={"type": "json_object"} 
                )
                raw_text = response.choices[0].message.content

            # Clean and Parse the JSON
            cleaned_json = raw_text.replace('```json', '').replace('```', '').strip()
            data = json.loads(cleaned_json)
            
            return Response({"report": data})

        except json.JSONDecodeError:
            print("Failed to parse JSON from AI:", raw_text)
            return Response({"error": "The AI generated an invalid report format. Please try again."}, status=500)
        except Exception as e:
            print(f"Project Analysis Error: {e}")
            return Response({"error": "Failed to connect to the AI provider. Check your API settings."}, status=500)
