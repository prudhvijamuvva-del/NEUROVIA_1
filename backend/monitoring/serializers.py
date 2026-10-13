from rest_framework import serializers
from .models import DataSource, ScanJob, SocialProfileCandidate, MobileAppCandidate
from brands.models import Brand

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ['id', 'source_id', 'name', 'platform_type', 'status', 'is_enabled', 'rate_limit_info', 'last_sync_at', 'api_endpoint']

class ScanJobSerializer(serializers.ModelSerializer):
    brand_name = serializers.ReadOnlyField(source='brand.name')

    class Meta:
        model = ScanJob
        fields = [
            'id', 'brand', 'brand_name', 'scan_type', 'status', 'trigger_type',
            'total_candidates', 'potential_threats_found', 'started_at', 'completed_at', 'error_message'
        ]
        read_only_fields = ['id', 'total_candidates', 'potential_threats_found', 'started_at', 'completed_at', 'error_message']

class SocialProfileCandidateSerializer(serializers.ModelSerializer):
    brand_name = serializers.ReadOnlyField(source='brand.name')

    class Meta:
        model = SocialProfileCandidate
        fields = [
            'id', 'brand', 'brand_name', 'scan_job', 'platform', 'username',
            'display_name', 'profile_url', 'avatar_url', 'bio', 'external_url',
            'followers_count', 'is_platform_verified', 'is_official_asset', 'discovered_at'
        ]

class MobileAppCandidateSerializer(serializers.ModelSerializer):
    brand_name = serializers.ReadOnlyField(source='brand.name')

    class Meta:
        model = MobileAppCandidate
        fields = [
            'id', 'brand', 'brand_name', 'scan_job', 'store', 'app_name',
            'developer_name', 'package_id', 'store_url', 'icon_url', 'description',
            'permissions', 'developer_website', 'rating', 'downloads_count',
            'is_official_asset', 'discovered_at'
        ]

class CandidateImportSerializer(serializers.Serializer):
    brand_id = serializers.UUIDField()
    import_type = serializers.ChoiceField(choices=['SOCIAL', 'APP_STORE'])
    records = serializers.ListField(child=serializers.DictField())

class ManualCandidateSubmitSerializer(serializers.Serializer):
    brand_id = serializers.UUIDField()
    candidate_type = serializers.ChoiceField(choices=['SOCIAL', 'APP_STORE'])
    platform_or_store = serializers.CharField()
    target_name = serializers.CharField()
    identifier = serializers.CharField()
    url = serializers.URLField()
    bio_or_description = serializers.CharField(required=False, allow_blank=True)
    developer_or_publisher = serializers.CharField(required=False, allow_blank=True)
    external_url = serializers.CharField(required=False, allow_blank=True)
