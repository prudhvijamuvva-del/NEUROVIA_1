import uuid
from django.db import models
from accounts.models import Organization
from brands.models import Brand

class DataSource(models.Model):
    class SourceStatus(models.TextChoices):
        LIVE_API = 'LIVE_API', 'Live Source (API Configured)'
        DEMO_DATA = 'DEMO_DATA', 'Demo Dataset (Synthetic)'
        UNAVAILABLE = 'UNAVAILABLE', 'Unavailable (No Credentials)'

    class PlatformType(models.TextChoices):
        SOCIAL = 'SOCIAL', 'Social Media'
        APP_STORE = 'APP_STORE', 'Application Store'

    source_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    platform_type = models.CharField(max_length=20, choices=PlatformType.choices)
    status = models.CharField(max_length=20, choices=SourceStatus.choices, default=SourceStatus.DEMO_DATA)
    is_enabled = models.BooleanField(default=True)
    rate_limit_info = models.CharField(max_length=100, default="100 requests/hour")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    api_endpoint = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} [{self.get_status_display()}]"

class ScanJob(models.Model):
    class ScanStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        RUNNING = 'RUNNING', 'Running'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    class ScanType(models.TextChoices):
        SOCIAL = 'SOCIAL', 'Social Monitoring Scan'
        APP_STORE = 'APP_STORE', 'App Store Monitoring Scan'
        FULL = 'FULL', 'Full Ecosystem Scan'

    class TriggerType(models.TextChoices):
        MANUAL = 'MANUAL', 'Manual Trigger'
        SCHEDULED = 'SCHEDULED', 'Scheduled Automation'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='scan_jobs')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='scan_jobs')
    scan_type = models.CharField(max_length=20, choices=ScanType.choices)
    status = models.CharField(max_length=20, choices=ScanStatus.choices, default=ScanStatus.PENDING)
    trigger_type = models.CharField(max_length=20, choices=TriggerType.choices, default=TriggerType.MANUAL)
    total_candidates = models.PositiveIntegerField(default=0)
    potential_threats_found = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Scan {self.scan_type} on {self.brand.name} ({self.status})"

class SocialProfileCandidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='social_candidates')
    scan_job = models.ForeignKey(ScanJob, on_delete=models.SET_NULL, null=True, blank=True, related_name='social_candidates')
    platform = models.CharField(max_length=30)
    username = models.CharField(max_length=150)
    display_name = models.CharField(max_length=255)
    profile_url = models.URLField(max_length=500)
    avatar_url = models.CharField(max_length=500, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    external_url = models.CharField(max_length=500, blank=True, default="")
    followers_count = models.IntegerField(null=True, blank=True)
    is_platform_verified = models.BooleanField(default=False)
    is_official_asset = models.BooleanField(default=False)
    raw_metadata = models.JSONField(default=dict, blank=True)
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-discovered_at']

    def __str__(self):
        return f"@{self.username} on {self.platform}"

class MobileAppCandidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='app_candidates')
    scan_job = models.ForeignKey(ScanJob, on_delete=models.SET_NULL, null=True, blank=True, related_name='app_candidates')
    store = models.CharField(max_length=30)
    app_name = models.CharField(max_length=255)
    developer_name = models.CharField(max_length=255)
    package_id = models.CharField(max_length=255)
    store_url = models.URLField(max_length=500)
    icon_url = models.CharField(max_length=500, blank=True, default="")
    description = models.TextField(blank=True, default="")
    permissions = models.JSONField(default=list, blank=True)
    developer_website = models.CharField(max_length=500, blank=True, default="")
    rating = models.FloatField(null=True, blank=True)
    downloads_count = models.CharField(max_length=50, blank=True, default="")
    is_official_asset = models.BooleanField(default=False)
    raw_metadata = models.JSONField(default=dict, blank=True)
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-discovered_at']

    def __str__(self):
        return f"{self.app_name} ({self.package_id}) on {self.store}"
