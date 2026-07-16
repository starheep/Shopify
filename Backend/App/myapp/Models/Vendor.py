from django.db import models
from django.contrib.auth.models import User



# Vendor Profile Logic
class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    vendor_name = models.CharField(max_length=100, unique=True) 
    is_approved = models.BooleanField(default=False) 
    
    location = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True, help_text="Full street address")
    website_url = models.URLField(max_length=500, blank=True, null=True)
    
    description = models.TextField(blank=True, null=True, help_text="About the store")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    support_email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.vendor_name

# Review Logic
class VendorReview(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return f"{self.user.username} - {self.vendor.vendor_name} - {self.rating} Stars"
