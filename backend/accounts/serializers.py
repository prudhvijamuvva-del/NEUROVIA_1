from rest_framework import serializers
from .models import User, Organization, OrganizationMembership, FaceEnrollment, AuditLog, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'mobile', 'is_email_verified', 'is_mobile_verified', 'is_face_enrolled', 'terms_consented', 'created_at']
        read_only_fields = ['id', 'is_email_verified', 'is_mobile_verified', 'is_face_enrolled', 'created_at']

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'created_at']

class MembershipSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = ['id', 'user', 'organization', 'role', 'is_active', 'created_at']

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    organization_name = serializers.CharField(max_length=255, required=False, default="")
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=30, required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    terms_consent = serializers.BooleanField()
    verification_channel = serializers.ChoiceField(choices=['EMAIL', 'SMS'], default='EMAIL')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if not attrs.get('terms_consent'):
            raise serializers.ValidationError({"terms_consent": "You must accept the terms and conditions."})
        email = attrs['email'].lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "An account with this email address already exists."})
        return attrs

class VerifyOTPSerializer(serializers.Serializer):
    destination = serializers.CharField()
    otp = serializers.CharField(max_length=10)
    purpose = serializers.ChoiceField(choices=['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'], default='REGISTRATION')

class LoginSerializer(serializers.Serializer):
    email_or_mobile = serializers.CharField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)

class ForgotPasswordSerializer(serializers.Serializer):
    destination = serializers.CharField()
    channel = serializers.ChoiceField(choices=['EMAIL', 'SMS'], default='EMAIL')

class ResetPasswordSerializer(serializers.Serializer):
    destination = serializers.CharField()
    otp = serializers.CharField(max_length=10)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

class FaceEnrollSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()
    consent = serializers.BooleanField(default=True)

class FaceVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    image_base64 = serializers.CharField()

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = AuditLog
        fields = ['id', 'user_email', 'action', 'entity_type', 'entity_id', 'details', 'ip_address', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'severity', 'threat_id', 'is_read', 'created_at']
