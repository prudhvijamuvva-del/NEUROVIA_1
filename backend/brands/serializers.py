import io
from PIL import Image
import imagehash
from rest_framework import serializers
from .models import Brand, OfficialBrandAsset

class OfficialBrandAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficialBrandAsset
        fields = [
            'id', 'brand', 'asset_type', 'platform', 'identifier',
            'official_url', 'publisher_or_developer_name', 'is_verified',
            'verified_at', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'verified_at']

class BrandSerializer(serializers.ModelSerializer):
    official_assets = OfficialBrandAssetSerializer(many=True, read_only=True)
    asset_count = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = [
            'id', 'organization', 'name', 'website_url', 'industry',
            'logo', 'logo_url', 'logo_hash', 'keywords', 'legitimate_domains',
            'description', 'is_active', 'created_at', 'updated_at',
            'official_assets', 'asset_count'
        ]
        read_only_fields = ['id', 'organization', 'logo_hash', 'created_at', 'updated_at']

    def get_asset_count(self, obj):
        return obj.official_assets.count()

    def create(self, validated_data):
        brand = super().create(validated_data)
        self._calculate_logo_hash(brand)
        return brand

    def update(self, instance, validated_data):
        brand = super().update(instance, validated_data)
        self._calculate_logo_hash(brand)
        return brand

    def _calculate_logo_hash(self, brand):
        try:
            if brand.logo and hasattr(brand.logo, 'path'):
                img = Image.open(brand.logo.path)
                h = imagehash.dhash(img)
                brand.logo_hash = str(h)
                brand.save(update_fields=['logo_hash'])
        except Exception:
            pass
