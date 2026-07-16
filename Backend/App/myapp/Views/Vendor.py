from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from myapp.Serializers.Product_Explorer import ProductSerializer
from myapp.Serializers.Vendor import VendorProfileSerializer

from myapp.Models.Product_Explorer import Product, Offer
from myapp.Models.Vendor import VendorProfile, VendorReview



class VendorProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.vendor_profile
            return Response({
                "location": profile.location or "",
                "address": profile.address or "",
                "website_url": profile.website_url or "",
                "description": profile.description or "",
                "phone_number": profile.phone_number or "",
                "support_email": profile.support_email or ""
            }, status=status.HTTP_200_OK)
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Update Fields send by the Frontend
        if 'location' in request.data:
            profile.location = request.data['location']
        if 'address' in request.data:               
            profile.address = request.data['address']
        if 'website_url' in request.data:
            profile.website_url = request.data['website_url']
        if 'description' in request.data:
            profile.description = request.data['description']
        if 'phone_number' in request.data:
            profile.phone_number = request.data['phone_number']
        if 'support_email' in request.data:
            profile.support_email = request.data['support_email']
        
        profile.save()
        return Response({"message": "Profile updated successfully!"}, status=status.HTTP_200_OK)

class LocalVendorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Figure out the logged-in user's city
        user_location = None
        if hasattr(request.user, 'profile') and request.user.profile.location:
            user_location = request.user.profile.location.strip().lower()
        elif hasattr(request.user, 'vendor_profile') and request.user.vendor_profile.location:
            user_location = request.user.vendor_profile.location.strip().lower()

        # 2. Find vendors in that exact city
        if user_location:
            # Case-insensitive search for vendors in the same location
            vendors = VendorProfile.objects.filter(location__iexact=user_location)
        else:
            vendors = VendorProfile.objects.none()

        serializer = VendorProfileSerializer(vendors, many=True)
        return Response(serializer.data)

class VendorProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            vendor = VendorProfile.objects.get(id=pk)
            # Find all products where this specific vendor has an offer
            products = Product.objects.filter(offers__vendor=vendor.vendor_name).distinct()
            
            serializer = ProductSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor not found"}, status=status.HTTP_404_NOT_FOUND)

class AddVendorReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            vendor = VendorProfile.objects.get(id=pk)
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor not found"}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get('rating')
        comment = request.data.get('comment')

        review = VendorReview.objects.create(
            vendor=vendor, user=request.user, rating=int(rating), comment=comment
        )
        
        for offer in Offer.objects.filter(vendor=vendor.vendor_name):
            offer.save()
        
        return Response({"message": "Review added!"}, status=status.HTTP_201_CREATED)