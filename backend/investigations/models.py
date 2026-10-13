import uuid
from django.db import models
from accounts.models import Organization, User
from brands.models import Brand
from monitoring.models import SocialProfileCandidate, MobileAppCandidate

class Detection(models.Model):
    class DetectionType(models.TextChoices):
        SOCIAL_PROFILE = 'SOCIAL_PROFILE', 'Social Media Profile'
        MOBILE_APP = 'MOBILE_APP', 'Mobile Application'

    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low Risk'
        MEDIUM = 'MEDIUM', 'Medium Risk'
        HIGH = 'HIGH', 'High Risk'
        CRITICAL = 'CRITICAL', 'Critical Risk'

    class Status(models.TextChoices):
        NEW = 'NEW', 'New Detection'
        INVESTIGATING = 'INVESTIGATING', 'Under Investigation'
        CONFIRMED = 'CONFIRMED', 'Confirmed Threat'
        FALSE_POSITIVE = 'FALSE_POSITIVE', 'False Positive'
        RESOLVED = 'RESOLVED', 'Resolved / Remediated'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='detections')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='detections')
    detection_type = models.CharField(max_length=30, choices=DetectionType.choices)
    
    # Linked candidates
    social_candidate = models.ForeignKey(SocialProfileCandidate, on_delete=models.SET_NULL, null=True, blank=True, related_name='detections')
    app_candidate = models.ForeignKey(MobileAppCandidate, on_delete=models.SET_NULL, null=True, blank=True, related_name='detections')

    target_name = models.CharField(max_length=255)
    target_identifier = models.CharField(max_length=255, blank=True, default="")
    platform_or_store = models.CharField(max_length=50)
    target_url = models.URLField(max_length=500)
    target_image_url = models.CharField(max_length=500, blank=True, default="")

    risk_score = models.IntegerField(default=0)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.LOW)
    confidence = models.CharField(max_length=20, default='MODERATE')
    
    name_score = models.FloatField(default=0.0)
    logo_score = models.FloatField(null=True, blank=True)
    desc_score = models.FloatField(null=True, blank=True)
    publisher_score = models.FloatField(null=True, blank=True)
    domain_score = models.FloatField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    assigned_analyst = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_detections')

    ai_explanation = models.JSONField(default=dict, blank=True)
    score_breakdown = models.JSONField(default=dict, blank=True)
    official_reporting_url = models.URLField(max_length=500, blank=True, default="")
    resolution_notes = models.TextField(blank=True, default="")

    first_seen_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-risk_score', '-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.target_name} ({self.platform_or_store}) - Score: {self.risk_score}"

class DetectionEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detection = models.ForeignKey(Detection, on_delete=models.CASCADE, related_name='evidences')
    category = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    details = models.TextField()
    score_contribution = models.FloatField(null=True, blank=True)
    method = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.title}"

class InvestigationNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detection = models.ForeignKey(Detection, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    note_text = models.TextField()
    is_internal = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.author} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
