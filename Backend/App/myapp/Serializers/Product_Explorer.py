from rest_framework import serializers

from myapp.Models.Product_Explorer import Product, Offer


class OfferSerializer(serializers.ModelSerializer):
    vendor = serializers.CharField()
    vendorType = serializers.CharField(source='vendor_type')
    deliveryDays = serializers.IntegerField(source='delivery_days')
    currency = serializers.SerializerMethodField()
    inStock = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = ['vendor', 'vendorType', 'price', 'currency', 'url', 'inStock', 'deliveryDays', 'rating', 'stock']

    def get_currency(self, obj):
        return "INR"
    
    def get_inStock(self, obj):
        return True
    

class ProductSerializer(serializers.ModelSerializer):
    prices = serializers.SerializerMethodField() 
    tags = serializers.SerializerMethodField()
    image = serializers.URLField(source='image_url', read_only=True)
    description = serializers.CharField(default="A great electronic component.", read_only=True)
    chart_history = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'image', 'description', 'tags', 'prices', 'chart_history']
        
    def get_prices(self, obj):
        request = self.context.get('request')
        user_location = None
        is_vendor = False
        vendor_name = None
        
        # User Check (Check who is logged in, and where they live)
        if request and request.user.is_authenticated:
            if hasattr(request.user, 'profile') and request.user.profile.location:
                user_location = request.user.profile.location.strip().lower()
            elif hasattr(request.user, 'vendor_profile'):
                is_vendor = True
                vendor_name = request.user.vendor_profile.vendor_name
                if request.user.vendor_profile.location:
                    user_location = request.user.vendor_profile.location.strip().lower()
        
        # Filter the offers (Either Online or Offline Vendors)
        # 1. Online Vendors should be visible to all users.
        # 2. Offline Vendors should be visible to those who live in same location 
        valid_offers = []
        for offer in obj.offers.all():
            if offer.vendor_type == 'ONLINE':
                valid_offers.append(offer) # Everyone sees Online
            elif offer.vendor_type == 'LOCAL':
                # Rule 1 --> A vendor sees their own products (nahi to kya matlab ki vendor khud ka maal na dekh paae)
                if is_vendor and offer.vendor == vendor_name:
                    valid_offers.append(offer)
                # Rule 2 --> Buyers see it if the location string matches exactly
                elif user_location and offer.vendor_location and offer.vendor_location.strip().lower() == user_location:
                    valid_offers.append(offer)
                        
        return OfferSerializer(valid_offers, many=True).data

    def get_tags(self, obj):
        if not obj.tags:
            return []
        return [tag.strip() for tag in obj.tags.split(',')]
    
    
    # This is actually for Price Intelligence though.
    # Still used here to reduce over-modularity burden.
    def get_chart_history(self, obj):
        history_logs = obj.history_logs.all()
        formatted_data = {}
        for log in history_logs:
            date_str = log.recorded_date.strftime("%b %d") 
            if date_str not in formatted_data:
                formatted_data[date_str] = {"name": date_str}
            formatted_data[date_str][log.vendor] = float(log.price)
        return list(formatted_data.values())    
