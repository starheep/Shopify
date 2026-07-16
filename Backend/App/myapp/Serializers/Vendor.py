from rest_framework import serializers
from django.db.models import Avg

from myapp.Models.Vendor import VendorProfile, VendorReview


# Review Logic
class VendorReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = VendorReview
        fields = ['id', 'user', 'rating', 'comment', 'date']

    def get_date(self, obj):
        return obj.created_at.strftime("%b %d, %Y")

# Vendor Representation Logic
class VendorProfileSerializer(serializers.ModelSerializer):
    reviews = VendorReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'vendor_name', 'location', 'website_url', 
            'description', 'phone_number', 'support_email', 
            'reviews', 'average_rating', 'review_count',
            'address'
        ]

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_review_count(self, obj):
        return obj.reviews.count()
