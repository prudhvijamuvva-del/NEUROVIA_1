from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Brand, OfficialBrandAsset
from .serializers import BrandSerializer, OfficialBrandAssetSerializer
from accounts.models import AuditLog

def get_user_org(user):
    membership = user.memberships.filter(is_active=True).first()
    return membership.organization if membership else None

class BrandListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BrandSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return Brand.objects.none()
        return Brand.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = get_user_org(self.request.user)
        if not org:
            raise ValueError("User has no active organization membership.")
        brand = serializer.save(organization=org)
        AuditLog.objects.create(
            user=self.request.user,
            organization=org,
            action="BRAND_CREATED",
            entity_type="Brand",
            entity_id=str(brand.id),
            details={"brand_name": brand.name}
        )

class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BrandSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return Brand.objects.none()
        return Brand.objects.filter(organization=org)

    def perform_update(self, serializer):
        brand = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            organization=brand.organization,
            action="BRAND_UPDATED",
            entity_type="Brand",
            entity_id=str(brand.id),
            details={"brand_name": brand.name}
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            organization=instance.organization,
            action="BRAND_DELETED",
            entity_type="Brand",
            entity_id=str(instance.id),
            details={"brand_name": instance.name}
        )
        instance.delete()

class BrandAssetCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OfficialBrandAssetSerializer

    def perform_create(self, serializer):
        org = get_user_org(self.request.user)
        brand = get_object_or_404(Brand, id=self.kwargs['brand_id'], organization=org)
        asset = serializer.save(
            brand=brand,
            verified_by=self.request.user,
            verified_at=timezone.now() if serializer.validated_data.get('is_verified', True) else None
        )
        AuditLog.objects.create(
            user=self.request.user,
            organization=org,
            action="OFFICIAL_ASSET_ADDED",
            entity_type="OfficialBrandAsset",
            entity_id=str(asset.id),
            details={
                "platform": asset.platform,
                "identifier": asset.identifier,
                "is_verified": asset.is_verified
            }
        )

class BrandAssetToggleVerifyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, asset_id):
        org = get_user_org(request.user)
        asset = get_object_or_404(OfficialBrandAsset, id=asset_id, brand__organization=org)
        asset.is_verified = not asset.is_verified
        asset.verified_at = timezone.now() if asset.is_verified else None
        asset.verified_by = request.user if asset.is_verified else None
        asset.save(update_fields=['is_verified', 'verified_at', 'verified_by'])

        AuditLog.objects.create(
            user=request.user,
            organization=org,
            action="OFFICIAL_ASSET_VERIFICATION_TOGGLED",
            entity_type="OfficialBrandAsset",
            entity_id=str(asset.id),
            details={"new_verified_status": asset.is_verified}
        )
        return Response(OfficialBrandAssetSerializer(asset).data)

class BrandAssetDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = get_user_org(self.request.user)
        return OfficialBrandAsset.objects.filter(brand__organization=org)
