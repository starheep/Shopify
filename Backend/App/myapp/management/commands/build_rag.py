from django.core.management.base import BaseCommand
from myapp.Models.Product_Explorer import Product
from myapp.Models.Project_Idea import ProjectIdea
from myapp.Models.Vendor import VendorProfile
from myapp.Signals.signals import sync_product_vector, sync_project_vector, sync_vendor_vector

class Command(BaseCommand):
    help = 'Generates Vector Embeddings for all existing MySQL data and saves them to ChromaDB.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Vectorizing Products...")
        for p in Product.objects.all():
            sync_product_vector(Product, p)
            
        self.stdout.write("Vectorizing Project Ideas...")
        for p in ProjectIdea.objects.all():
            sync_project_vector(ProjectIdea, p)
            
        self.stdout.write("Vectorizing Approved Vendors...")
        for v in VendorProfile.objects.filter(is_approved=True):
            sync_vendor_vector(VendorProfile, v)
            
        self.stdout.write(self.style.SUCCESS("Successfully built the RAG Vector Database!"))