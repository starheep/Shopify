import chromadb
from google import genai
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from Confidential.Keys import GEMINI_API_KEY, GROQ_API_KEY

from Models.Product_Explorer import Product
from Models.Project_Idea import ProjectIdea, ProjectReview
from Backend.App.myapp.Models.Vendor import VendorProfile, VendorReview


# Initialize ChromaDB and Google GenAI Client
chroma_client = chromadb.PersistentClient(path="Backend/App/vector_db")
collection = chroma_client.get_or_create_collection(name="shopway_unified")
ai_client = genai.Client(api_key=GEMINI_API_KEY)

def generate_embedding(text: str):
    response = ai_client.models.embed_content(
        model='gemini-embedding-001',
        contents=text
    )
    return response.embeddings[0].values

@receiver(post_save, sender=Product)
def sync_product_vector(sender, instance, **kwargs):
    
    # 1. Format the data into a rich "document"
    text_content = f"Product: {instance.name}. Category: {instance.category}. Tags: {instance.tags}."
    
    # 2. Convert to Vector
    vector = generate_embedding(text_content)
    
    # 3. Upsert into ChromaDB with a prefixed ID and metadata
    collection.upsert(
        ids=[f"prod_{instance.id}"],
        embeddings=[vector],
        documents=[text_content],
        metadatas=[{"type": "product", "category": instance.category}]
    )

@receiver(post_save, sender=ProjectIdea)
def sync_project_vector(sender, instance, **kwargs):
    # Include components in the project vector so it's searchable by hardware!
    components = ", ".join([c.name for c in instance.components.all()])
    text_content = f"Project Idea: {instance.title}. Difficulty: {instance.difficulty}. Category: {instance.category}. Components used: {components}. Description: {instance.description}."
    
    vector = generate_embedding(text_content)
    
    collection.upsert(
        ids=[f"proj_{instance.id}"],
        embeddings=[vector],
        documents=[text_content],
        metadatas=[{"type": "project", "difficulty": instance.difficulty}]
    )

@receiver(post_save, sender=VendorProfile)
def sync_vendor_vector(sender, instance, **kwargs):
    if not instance.is_approved:
        return # Don't vectorize unapproved vendors
        
    # Aggregate their top reviews to give the AI context on their reputation
    top_reviews = instance.reviews.all()[:3]
    review_text = " ".join([f'"{r.comment}"' for r in top_reviews])
    
    text_content = f"Local Vendor: {instance.vendor_name}. Location: {instance.location}. Description: {instance.description}. Customer Reviews: {review_text}."
    
    vector = generate_embedding(text_content)
    
    collection.upsert(
        ids=[f"vend_{instance.id}"],
        embeddings=[vector],
        documents=[text_content],
        metadatas=[{"type": "vendor", "location": instance.location}]
    )

# Clean up ChromaDB if a record is deleted from MySQL
@receiver(post_delete, sender=Product)
def delete_product_vector(sender, instance, **kwargs):
    collection.delete(ids=[f"prod_{instance.id}"])
    

# When a new Vendor Review is posted, force the Vendor's RAG vector to update!
@receiver(post_save, sender=VendorReview)
def update_vendor_vector_on_review(sender, instance, **kwargs):
    vendor = instance.vendor
    sync_vendor_vector(VendorProfile, vendor)

# When a new Project Review is posted, force the Project's RAG vector to update!
@receiver(post_save, sender=ProjectReview)
def update_project_vector_on_review(sender, instance, **kwargs):
    project = instance.project
    sync_project_vector(ProjectIdea, project)