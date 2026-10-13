from rest_framework import serializers
from .models import Detection, DetectionEvidence, InvestigationNote
from accounts.serializers import UserSerializer

class DetectionEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectionEvidence
        fields = ['id', 'category', 'title', 'details', 'score_contribution', 'method', 'created_at']

class InvestigationNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name')
    author_email = serializers.ReadOnlyField(source='author.email')

    class Meta:
        model = InvestigationNote
        fields = ['id', 'detection', 'author', 'author_name', 'author_email', 'note_text', 'is_internal', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

class DetectionSerializer(serializers.ModelSerializer):
    brand_name = serializers.ReadOnlyField(source='brand.name')
    assigned_analyst_name = serializers.ReadOnlyField(source='assigned_analyst.full_name')
    evidences = DetectionEvidenceSerializer(many=True, read_only=True)
    notes = InvestigationNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Detection
        fields = [
            'id', 'organization', 'brand', 'brand_name', 'detection_type',
            'target_name', 'target_identifier', 'platform_or_store', 'target_url',
            'target_image_url', 'risk_score', 'severity', 'confidence',
            'name_score', 'logo_score', 'desc_score', 'publisher_score', 'domain_score',
            'status', 'assigned_analyst', 'assigned_analyst_name',
            'ai_explanation', 'score_breakdown', 'official_reporting_url', 'resolution_notes',
            'first_seen_at', 'last_seen_at', 'created_at', 'updated_at',
            'evidences', 'notes'
        ]
        read_only_fields = ['id', 'organization', 'brand_name', 'created_at', 'updated_at']

class DetectionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detection
        fields = ['status', 'assigned_analyst', 'resolution_notes']
