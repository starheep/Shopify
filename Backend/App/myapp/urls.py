from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework_simplejwt.views import TokenRefreshView # <-- 1. ADD THIS IMPORT

from .Views.Chatbot import ChatbotView
from .Views.Kit_Builder import KitViewSet
from .Views.Product_Explorer import ProductListView
from .Views.Project_Idea import ProjectIdeaListView, AddProjectReviewView, CloneProjectView
from .Views.Project_Analysis import AnalyzeProjectView
from .Views.Registration import RegisterView, CustomLoginView
from .Views.Vendor_Dashboard import VendorInventoryView
from .Views.Vendor import VendorProductsView, AddVendorReviewView, VendorProfileUpdateView, LocalVendorsView

from django.urls import path, include

router = DefaultRouter()
router.register(r'kits', KitViewSet, basename='kit')

urlpatterns = [
    # The API endpoints
    path('myapp/', include(router.urls)), # Prefix API routes with 'myapp/'
    path('myapp/products/', ProductListView.as_view()),
    path('myapp/ideas/', ProjectIdeaListView.as_view()),
    path('myapp/chat/', ChatbotView.as_view()),
    path('myapp/register/', RegisterView.as_view()),
    path('myapp/login/', obtain_auth_token),
    path('myapp/analyze/', AnalyzeProjectView.as_view(), name='analyze_project'),
    path('vendor/inventory/', VendorInventoryView.as_view(), name='vendor-inventory'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomLoginView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('', include(router.urls)), # This auto-generates /kits/ and /kits/<id>/sync_items/
    path('myapp/ideas/<int:pk>/clone/', CloneProjectView.as_view(), name='clone-project'),
    path('myapp/ideas/<int:pk>/review/', AddProjectReviewView.as_view(), name='add-review'),
    path('myapp/local-vendors/', LocalVendorsView.as_view(), name='local-vendors'),
    path('myapp/local-vendors/<int:pk>/products/', VendorProductsView.as_view(), name='vendor-products'),
    path('myapp/local-vendors/<int:pk>/review/', AddVendorReviewView.as_view(), name='vendor-review'),
    path('vendor/profile/', VendorProfileUpdateView.as_view(), name='vendor-profile-update'),
]