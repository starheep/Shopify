# myapp/ai_tools.py
from django.contrib.auth.models import User

from myapp.Models.Kit_Builder import SavedKit, KitItem
from myapp.Models.Product_Explorer import Product, Offer
from myapp.Models.Project_Idea import ProjectIdea
from myapp.Models.Vendor import VendorProfile

import chromadb
from google import genai

from myapp.Confidential.Keys import GEMINI_API_KEY, GROQ_API_KEY

chroma_client = chromadb.PersistentClient(path="./vector_db")
collection = chroma_client.get_or_create_collection(name="shopway_unified")
ai_client = genai.Client(api_key=GEMINI_API_KEY)

def global_rag_search(search_query: str, domain_filter: str = "all") -> str:
    """
    Searches across Products, Projects, and Vendors using Vector Embeddings.
    domain_filter can be 'all', 'product', 'project', or 'vendor'.
    """
    try:
        # 1. Embed the search query
        query_vector = ai_client.models.embed_content(
            model='gemini-embedding-001', contents=search_query
        ).embeddings[0].values

        # 2. Prepare Metadata Filter (if the AI only wants to search projects, for example)
        where_clause = None
        if domain_filter != "all":
            where_clause = {"type": domain_filter}

        # 3. Query ChromaDB
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=6,
            where=where_clause
        )
        
        matched_ids = results['ids'][0]
        if not matched_ids:
            return f"No relevant data found for '{search_query}'."

        # 4. Parse the Prefixed IDs and route them to the correct MySQL Tables
        response_lines = [f"--- RAG Search Results for '{search_query}' ---"]
        
        for chorma_id in matched_ids:
            prefix, mysql_id = chorma_id.split('_')
            
            if prefix == "prod":
                p = Product.objects.filter(id=mysql_id).first()
                if p:
                    price = p.offers.first().price if p.offers.first() else "N/A"
                    response_lines.append(f"[PRODUCT] ID:{p.id} | {p.name} | Cat:{p.category} | Est.₹{price}")
                    
            elif prefix == "proj":
                p = ProjectIdea.objects.filter(id=mysql_id).first()
                if p:
                    response_lines.append(f"[PROJECT] ID:{p.id} | {p.title} | Diff:{p.difficulty} | Clones:{p.clones}")
                    
            elif prefix == "vend":
                v = VendorProfile.objects.filter(id=mysql_id).first()
                if v:
                    # Fetch the actual review text so the AI can read it!
                    top_reviews = v.reviews.all()[:3]
                    review_texts = " | ".join([f'"{r.comment}" ({r.rating}★)' for r in top_reviews])
                    if not review_texts:
                        review_texts = "No reviews yet."
                        
                    response_lines.append(f"[VENDOR] {v.vendor_name} | Loc:{v.location} | Reviews: {review_texts}")

        return "\n".join(response_lines)
        
    except Exception as e:
        return f"Semantic search failed: {str(e)}"





# --- TOOL 1: Create Kit ---
def create_smart_kit(user_username: str, kit_name: str, component_names: list[str]) -> str:
    """Creates a new project kit and adds components."""
    try:
        user = User.objects.get(username=user_username)
        new_kit = SavedKit.objects.create(user=user, kit_name=kit_name, description="AI Generated Kit")
        
        added = []
        for item_name in component_names:
            product = Product.objects.filter(name__icontains=item_name).first()
            if product:
                KitItem.objects.create(kit=new_kit, product=product, quantity=1)
                added.append(product.name)
                
        if not added: return f"Kit '{kit_name}' created, but items weren't found."
        return f"Created kit '{kit_name}' containing: {', '.join(added)}."
    except Exception as e:
        return f"Failed: {str(e)}"

# --- TOOL 2: Clone Project ---
def clone_project_for_user(user_username: str, project_id: int) -> str:
    """Clones an existing community project."""
    try:
        user = User.objects.get(username=user_username)
        project = ProjectIdea.objects.get(id=project_id)
        new_kit = SavedKit.objects.create(user=user, kit_name=f"Clone: {project.title}", description=project.description)
        for product in project.components.all():
            KitItem.objects.create(kit=new_kit, product=product, quantity=1)
        project.clones += 1
        project.save()
        return f"Successfully cloned '{project.title}'."
    except Exception as e:
        return f"Failed: {str(e)}"

# --- TOOL 3: Vendor Inventory ---
def add_vendor_inventory(vendor_name: str, product_name: str, category: str, price: float, stock: int) -> str:
    """Adds or updates a product offer in the vendor's local store."""
    try:
        vendor_profile = VendorProfile.objects.get(vendor_name=vendor_name)
        product, _ = Product.objects.get_or_create(name=product_name, defaults={'category': category})
        Offer.objects.update_or_create(
            product=product, vendor=vendor_name,
            defaults={'vendor_type': 'LOCAL', 'vendor_location': vendor_profile.location, 'price': price, 'stock': stock}
        )
        return f"Successfully updated '{product_name}' at ₹{price}."
    except Exception as e:
        return f"Failed: {str(e)}"