from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated


from myapp.Models.Product_Explorer import Product
from myapp.Models.Kit_Builder import SavedKit, KitItem

from myapp.Serializers.Kit_Builder import SavedKitSerializer



class KitViewSet(viewsets.ModelViewSet):
    serializer_class = SavedKitSerializer
    # MUST be logged in to have a Kit
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        # Only show kits that belong to the person logged in
        return SavedKit.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # When creating a new kit, attach it to the logged-in user only, and automatically
        serializer.save(user=self.request.user)

    # Save the Items Data Send by the Frontend
    @action(detail=True, methods=['post'])
    def sync_items(self, request, pk=None):
        kit = self.get_object()
        items_data = request.data.get('items', [])

        # Clear out the old items in the database for this specific kit
        kit.kit_items.all().delete()

        # Save the new ones sent from Frontend
        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'])
                KitItem.objects.create(kit=kit, product=product, quantity=item['quantity'])
            except Product.DoesNotExist:
              continue

        return Response({'status': 'Kit synced successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        kit = self.get_object()
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
            item, created = KitItem.objects.get_or_create(kit=kit, product=product)
            if not created:
                item.quantity += quantity
            else:
                item.quantity = quantity
            item.save()

            return Response({'status': 'Item added'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
