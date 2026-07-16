from django.contrib import admin

from .Models.Product_Explorer import Product, Offer
from .Models.Project_Idea import ProjectIdea
from .Models.Vendor import VendorProfile
from .Models.Price_Intelligence import PriceHistory
from .Models.Kit_Builder import KitItem, SavedKit

from django.contrib import messages
from .Tools.Scraper import fetch_and_store_products


# Define the Action Function (to fetch latest data through a button)
def trigger_data_fetch(modeladmin, request, queryset):
    """
    This function runs when Admin clicks 'Fetch Latest Data' in the dashboard.
    """
    # 1. Run the utility script
    report = fetch_and_store_products()
    
    # 2. Show a success message to the Admin
    modeladmin.message_user(request, report, messages.SUCCESS)
    

# Naming the Action to show in UI
trigger_data_fetch.short_description = "⚡ Fetch/Update Live Data from APIs"

class OfferInline(admin.TabularInline):
    model = Offer
    extra = 1

class KitItemInline(admin.TabularInline):
    model = KitItem
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'id')
    search_fields = ('name', 'tags')
    list_filter = ('category',)
    inlines = [OfferInline]
    
    actions = [trigger_data_fetch] 

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('product', 'vendor', 'price', 'rating')
    list_filter = ('vendor',)
    

@admin.register(ProjectIdea)
class ProjectIdeaAdmin(admin.ModelAdmin):
    list_display = ('title', 'student_name', 'university', 'category', 'difficulty')
    search_fields = ('title', 'tags', 'student_name')
    list_filter = ('category', 'difficulty')
    
    filter_horizontal = ('components',)
    

@admin.register(SavedKit)
class SavedKitAdmin(admin.ModelAdmin):
    list_display = ('kit_name', 'user', 'created_at')
    search_fields = ('kit_name', 'user__username')
    list_filter = ('created_at',)
    inlines = [KitItemInline]


@admin.register(PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'vendor', 'price', 'recorded_date')
    search_fields = ('product__name', 'vendor')
    list_filter = ('vendor', 'recorded_date')  
    
admin.site.register(VendorProfile)