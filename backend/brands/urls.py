from django.urls import path
from .views import (
    BrandListCreateView,
    BrandDetailView,
    BrandAssetCreateView,
    BrandAssetToggleVerifyView,
    BrandAssetDeleteView
)

urlpatterns = [
    path('', BrandListCreateView.as_view(), name='brand-list-create'),
    path('<uuid:pk>/', BrandDetailView.as_view(), name='brand-detail'),
    path('<uuid:brand_id>/assets/', BrandAssetCreateView.as_view(), name='brand-asset-create'),
    path('assets/<uuid:asset_id>/toggle-verify/', BrandAssetToggleVerifyView.as_view(), name='brand-asset-toggle-verify'),
    path('assets/<uuid:pk>/delete/', BrandAssetDeleteView.as_view(), name='brand-asset-delete'),
]
