from rest_framework import serializers

from myapp.Models.Product_Explorer import Product
from myapp.Models.Kit_Builder import SavedKit, KitItem

from .Product_Explorer import ProductSerializer


class KitItemSerializer(serializers.ModelSerializer):
    # Read-only fields to show product details in JSON
    # price = serializers.ReadOnlyField(source='product.offers.first.price')
    # product_name = serializers.ReadOnlyField(source='product.name')
    
    product = ProductSerializer(read_only=True)
    
    # Write-only field to accept ID when adding item
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = KitItem
        # fields = ['id', 'product_id', 'product_name', 'price', 'quantity']
        fields = ['id', 'product_id', 'product', 'quantity']
        


class SavedKitSerializer(serializers.ModelSerializer):
    items = KitItemSerializer(source='kit_items', many=True, read_only=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = SavedKit
        fields = ['id', 'kit_name', 'created_at', 'total_cost', 'items', 'description']

    def get_total_cost(self, obj):
        total = 0
        for kit_item in obj.kit_items.all():
            first_offer = kit_item.product.offers.first()
            price = first_offer.price if first_offer else 0
            total += price * kit_item.quantity
        return total
