from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from myapp.Models.Vendor import VendorProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        # Hide password from response, but allow it in request
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # We override create to ensure the password is encrypted (hashed)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


# Login Logic
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        
        if hasattr(self.user, 'vendor_profile'):
            data['is_vendor'] = True
            data['vendor_name'] = self.user.vendor_profile.vendor_name
            data['is_approved'] = self.user.vendor_profile.is_approved
            data['location'] = self.user.vendor_profile.location
        else:
            data['is_vendor'] = False
            data['vendor_name'] = None
            data['is_approved'] = False
            # Grab standard user location!
            data['location'] = self.user.profile.location if hasattr(self.user, 'profile') else None
            
        return data


# Registration Logic
class RegisterSerializer(serializers.ModelSerializer):
    is_vendor = serializers.BooleanField(write_only=True, required=False, default=False)
    vendor_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    website_url = serializers.URLField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'is_vendor', 'vendor_name', 'location', 'website_url')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        is_vendor = validated_data.pop('is_vendor', False)
        vendor_name = validated_data.pop('vendor_name', '')
        location = validated_data.pop('location', '')
        website_url = validated_data.pop('website_url', '')
        
        user = User.objects.create_user(**validated_data)
        
        if is_vendor and vendor_name:
            VendorProfile.objects.create(
                user=user, vendor_name=vendor_name, location=location, website_url=website_url, is_approved=False 
            )
        else:
            # Create normal user profile!
            from Backend.App.myapp.Models.TC_User import UserProfile 
            UserProfile.objects.create(user=user, location=location)
            
        return user