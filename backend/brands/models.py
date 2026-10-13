import uuid
from django.db import models
from accounts.models import Organization, User

class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='brands')
    name = models.CharField(max_length=255)
    website_url = models.URLField(max_length=500)
    industry = models.CharField(max_length=100, default="Technology & Software")
    logo = models.ImageField(upload_to='brand_logos/', null=True, blank=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    logo_hash = models.CharField(max_length=64, blank=True, null=True, help_text="Perceptual dHash / pHash of official logo")
    keywords = models.JSONField(default=list, blank=True, help_text="List of keywords, aliases, variations")
    legitimate_domains = models.JSONField(default=list, blank=True, help_text="Legitimate domains e.g. brandshield.com")
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class OfficialBrandAsset(models.Model):
    class AssetType(models.TextChoices):
        SOCIAL_ACCOUNT = 'SOCIAL_ACCOUNT', 'Social Media Account'
        MOBILE_APP = 'MOBILE_APP', 'Official Mobile App'

    class Platform(models.TextChoices):
        INSTAGRAM = 'INSTAGRAM', 'Instagram'
        FACEBOOK = 'FACEBOOK', 'Facebook'
        TWITTER_X = 'TWITTER_X', 'X (Twitter)'
        LINKEDIN = 'LINKEDIN', 'LinkedIn'
        YOUTUBE = 'YOUTUBE', 'YouTube'
        TIKTOK = 'TIKTOK', 'TikTok'
        GOOGLE_PLAY = 'GOOGLE_PLAY', 'Google Play Store'
        APPLE_APP_STORE = 'APPLE_APP_STORE', 'Apple App Store'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='official_assets')
    asset_type = models.CharField(max_length=30, choices=AssetType.choices)
    platform = models.CharField(max_length=30, choices=Platform.choices)
    identifier = models.CharField(max_length=255, help_text="Username, handle, or package identifier e.g. com.brand.app")
    official_url = models.URLField(max_length=500)
    publisher_or_developer_name = models.CharField(max_length=255, blank=True, default="")
    is_verified = models.BooleanField(default=True, help_text="Verified assets are strictly excluded from impersonation alerts")
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['platform', 'identifier']

    def __str__(self):
        return f"{self.get_platform_display()}: {self.identifier} ({'Verified' if self.is_verified else 'Unverified'})"
