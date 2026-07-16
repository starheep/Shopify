from django.db import models
from django.contrib.auth.models import User

from .Product_Explorer import Product


class SavedKit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    kit_name = models.CharField(max_length=100)
    items = models.ManyToManyField(Product, through='KitItem')
    created_at = models.DateTimeField(auto_now_add=True)
    
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{self.user.username} - {self.kit_name}"


class KitItem(models.Model):
    kit = models.ForeignKey(SavedKit, related_name='kit_items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} (x{self.quantity})"
