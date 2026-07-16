from django.db import models

from .Product_Explorer import Product


class PriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='history_logs')
    vendor = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_date = models.DateField(auto_now_add=True)

    class Meta:
        # Prevent storing multiple identical prices for the same vendor on the same day
        unique_together = ('product', 'vendor', 'recorded_date') 
        ordering = ['recorded_date']

    def __str__(self):
        return f"{self.product.name} - {self.vendor} - {self.price} on {self.recorded_date}"
    
