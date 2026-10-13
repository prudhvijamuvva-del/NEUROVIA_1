import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=30, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_mobile_verified = models.BooleanField(default=False)
    is_face_enrolled = models.BooleanField(default=False)
    terms_consented = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.full_name})"

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class OrganizationMembership(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Organization Admin'
        ANALYST = 'ANALYST', 'Security Analyst'
        VIEWER = 'VIEWER', 'Read-Only Viewer'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ANALYST)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'organization')

    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"

class OTPVerification(models.Model):
    class Purpose(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Registration Verification'
        LOGIN = 'LOGIN', 'Login Verification'
        PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'

    class Channel(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        SMS = 'SMS', 'SMS'

    destination = models.CharField(max_length=255, db_index=True)
    otp_hash = models.CharField(max_length=128)  # SHA-256 salted hash, NEVER plaintext
    salt = models.CharField(max_length=64)
    purpose = models.CharField(max_length=30, choices=Purpose.choices)
    channel = models.CharField(max_length=10, choices=Channel.choices)
    attempts = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def hash_otp(cls, otp: str, salt: str) -> str:
        return hashlib.sha256(f"{salt}:{otp}".encode('utf-8')).hexdigest()

    def check_otp(self, raw_otp: str) -> bool:
        if self.is_expired() or self.is_verified:
            return False
        computed = self.hash_otp(raw_otp, self.salt)
        return computed == self.otp_hash

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def can_resend(self, cooldown_seconds: int = 60) -> bool:
        return timezone.now() >= self.created_at + timedelta(seconds=cooldown_seconds)

    def __str__(self):
        return f"OTP({self.destination}, {self.purpose}, verified={self.is_verified})"

class FaceEnrollment(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_enrollment')
    consent_given = models.BooleanField(default=True)
    consent_timestamp = models.DateTimeField(auto_now_add=True)
    # Store mathematical biometric feature representation (512-dim embedding / perceptual descriptors hash), never raw face images!
    feature_signature = models.TextField(help_text="Secure salted biometric feature signature hash")
    liveness_profile = models.CharField(max_length=50, default="OPENCV_MULTI_FEATURE")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FaceEnrollment({self.user.email}, active={self.is_active})"

class AuditLog(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.action} by {self.user}"

class Notification(models.Model):
    class Severity(models.TextChoices):
        INFO = 'INFO', 'Information'
        WARNING = 'WARNING', 'Warning'
        CRITICAL = 'CRITICAL', 'Critical Alert'

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    threat_id = models.CharField(max_length=100, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.severity}: {self.title}"
