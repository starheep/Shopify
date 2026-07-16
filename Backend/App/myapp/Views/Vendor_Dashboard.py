from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from myapp.Models.Product_Explorer import Product, Offer
from myapp.Models.Vendor import VendorProfile



class VendorInventoryView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        vendor_name = data.get('vendor_name')
        product_id = data.get('product_id')
        
        # Fetch the vendor's location
        try:
            vendor_profile = VendorProfile.objects.get(vendor_name=vendor_name)
            vendor_location = vendor_profile.location
        except VendorProfile.DoesNotExist:
            vendor_location = None

        if product_id and str(product_id).lower() != 'other':
            product = Product.objects.get(id=product_id)
        else:
            product, _ = Product.objects.get_or_create(
                name=data.get('name'), defaults={'category': data.get('category', 'Electronics')}
            )
        
        # Save the vendor_type and vendor_location!
        offer, created = Offer.objects.update_or_create(
            product=product,
            vendor=vendor_name,
            defaults={
                'vendor_type': 'LOCAL', 
                'vendor_location': vendor_location, 
                'price': data.get('price'),
                'stock': data.get('stock', 10),
                'rating': 0.0,
                'delivery_days': 0,
                'url': 'https://techshopway.com'
            }
        )
        return Response({"message": "Listing saved successfully!", "id": product.id}, status=status.HTTP_200_OK)
    
    def delete(self, request):
        # ... (keep your existing delete method exactly the same)
        product_id = request.query_params.get('product_id')
        vendor_name = request.query_params.get('vendor_name')
        try:
            offer = Offer.objects.get(product_id=product_id, vendor=vendor_name)
            offer.delete()
            return Response({"message": "Listing removed."}, status=status.HTTP_204_NO_CONTENT)
        except Offer.DoesNotExist:
            return Response({"error": "Offer not found."}, status=status.HTTP_404_NOT_FOUND)

