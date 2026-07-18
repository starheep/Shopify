from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .Views.Chatbot import ChatbotView
from .Views.Kit_Builder import KitViewSet
from .Views.Product_Explorer import ProductListView
from .Views.Project_Idea import (
    ProjectIdeaListView,
    AddProjectReviewView,
    CloneProjectView,
)
from .Views.Project_Analysis import AnalyzeProjectView
from .Views.Registration import RegisterView, CustomLoginView
from .Views.Vendor_Dashboard import VendorInventoryView
from .Views.Vendor import (
    VendorProductsView,
    AddVendorReviewView,
    VendorProfileUpdateView,
    LocalVendorsView,
)

# -----------------------------
# Router Configuration
# -----------------------------
router = DefaultRouter()
router.register(r'kits', KitViewSet, basename='kit')

urlpatterns = [

    # =========================
    # Authentication
    # =========================
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # =========================
    # Products & Kits
    # =========================
    path('products/', ProductListView.as_view(), name='products'),
    path('', include(router.urls)),

    # =========================
    # AI Features
    # =========================
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('analyze/', AnalyzeProjectView.as_view(), name='analyze-project'),

    # =========================
    # Project Ideas
    # =========================
    path('ideas/', ProjectIdeaListView.as_view(), name='project-ideas'),
    path('ideas/<int:pk>/clone/', CloneProjectView.as_view(), name='clone-project'),
    path('ideas/<int:pk>/review/', AddProjectReviewView.as_view(), name='project-review'),

    # =========================
    # Vendors
    # =========================
    path('vendors/', LocalVendorsView.as_view(), name='vendors'),
    path('vendors/<int:pk>/products/', VendorProductsView.as_view(), name='vendor-products'),
    path('vendors/<int:pk>/review/', AddVendorReviewView.as_view(), name='vendor-review'),

    # =========================
    # Vendor Dashboard
    # =========================
    path('vendor/inventory/', VendorInventoryView.as_view(), name='vendor-inventory'),
    path('vendor/profile/', VendorProfileUpdateView.as_view(), name='vendor-profile'),
]