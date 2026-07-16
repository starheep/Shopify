from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics


from django.db.models import Min

from myapp.Models.Product_Explorer import Product
from myapp.Serializers.Product_Explorer import ProductSerializer

import math



# Pagination Implementation
class ProductPagination(PageNumberPagination):
    page_size = 12 # Define how many items per page
    page_size_query_param = 'page_size'
    max_page_size = 50

# Products View 
class ProductListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    pagination_class = ProductPagination

    # Handle Database Filtering via SQL
    def get_queryset(self):
        # Annotate so we can sort products by their absolute lowest price
        queryset = Product.objects.all().annotate(min_price=Min('offers__price'))
        
        # 1. Search Filter
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        # 2. Categories Filter (FIXED: React sends 'categories' plural, comma-separated)
        categories = self.request.query_params.get('categories')
        if categories:
            cat_list = categories.split(',')
            queryset = queryset.filter(category__in=cat_list)
            
        # 3. Budget Filter (RESTORED: Filters by the annotated min_price)
        budget = self.request.query_params.get('budget')
        if budget:
            queryset = queryset.filter(min_price__lte=budget)

        # 4. Sorting
        sort = self.request.query_params.get('sort')
        if sort == 'price_asc':
            # Add 'id' as a tie-breaker just in case two items have the exact same price
            queryset = queryset.order_by('min_price', 'id')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-min_price', 'id')
        else:
            queryset = queryset.order_by('id')

        return queryset.distinct()
    
    # Intercept the 12 items to apply TOPSIS math to the VENDORS
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Loop through only the 12 products on this specific page
        for product in response.data['results']:
            vendors = product.get('prices', []) 
            
            if len(vendors) > 1:
                # Apply TOPSIS to the nested vendor list!
                product['prices'] = self.apply_vendor_topsis(vendors)

        return response

    # TOPSIS to sort a list of vendors/offers
    def apply_vendor_topsis(self, vendors):
        w_price, w_rating, w_delivery = 0.6, 0.3, 0.1
        
        # Safely convert to float before doing the math
        denom_p = math.sqrt(sum(float(v.get('price', 0))**2 for v in vendors)) or 1
        denom_r = math.sqrt(sum(float(v.get('rating', 0))**2 for v in vendors)) or 1
        denom_d = math.sqrt(sum(float(v.get('delivery_days', 0) or 0)**2 for v in vendors)) or 1

        for v in vendors:
            # Normalize
            n_p = (float(v.get('price', 0)) / denom_p) * w_price
            n_r = (float(v.get('rating', 0)) / denom_r) * w_rating
            
            # Use 'or 0' to handle None types safely before casting to float
            n_d = (float(v.get('delivery_days') or 0) / denom_d) * w_delivery
            
            # Simple weighted score
            v['topsis_score'] = (n_r) / (n_p + n_d + 0.0001)

        # Sort the vendors so the highest TOPSIS score is at index 0
        vendors.sort(key=lambda x: x.get('topsis_score', 0), reverse=True)
        
        return vendors        
