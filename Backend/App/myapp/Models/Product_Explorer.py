from django.db import models
from django.db.models import Avg
from django.apps import apps
from django.utils import timezone


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Mechanical', 'Mechanical'),
        ('Civil', 'Civil'),
        ('CS/AI', 'CS/AI'),
    ]
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    tags = models.TextField(help_text="Comma-separated tags e.g. 'arduino, iot'")
    image_url = models.URLField(max_length=500, blank=True, null=True)
    
    def __str__(self):
        return self.name

class Offer(models.Model):
    VENDOR_TYPES = [
        ('ONLINE', 'Online Platform'),
        ('LOCAL', 'Local Partner'),
    ]
    vendor_type = models.CharField(max_length=20, choices=VENDOR_TYPES, default='ONLINE')
    vendor_location = models.CharField(max_length=255, blank=True, null=True)
    
    product = models.ForeignKey(Product, related_name='offers', on_delete=models.CASCADE)
    vendor = models.CharField(max_length=50)  # Amazon, Flipkart
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.FloatField(default=0)
    delivery_days = models.IntegerField(default=0)
    url = models.URLField(default="https://techshopway.com")
    stock = models.IntegerField(default=10)
    
    def save(self, *args, **kwargs):
        # 1. Sync Local Vendor Ratings
        if self.vendor_type == 'LOCAL':
            VendorProfile = apps.get_model(self._meta.app_label, 'VendorProfile')
            try:
                profile = VendorProfile.objects.get(vendor_name=self.vendor)
                avg_rating = profile.reviews.aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    self.rating = round(avg_rating, 1)
            except VendorProfile.DoesNotExist:
                pass
                
        # 2. Save the Offer normally
        super().save(*args, **kwargs)

        # 3. Automatically Log Price History!
        PriceHistory = apps.get_model(self._meta.app_label, 'PriceHistory')
        PriceHistory.objects.update_or_create(
            product=self.product,
            vendor=self.vendor,
            recorded_date=timezone.now().date(),
            defaults={'price': self.price}
        )

    def __str__(self):
        return f"{self.vendor} - {self.product.name}"

