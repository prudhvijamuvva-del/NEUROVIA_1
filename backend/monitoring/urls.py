from django.urls import path
from .views import (
    DataSourceListView,
    DataSourceUpdateView,
    ScanJobListView,
    ScanJobDetailView,
    SocialMonitoringCandidateListView,
    AppStoreCandidateListView,
    TriggerSocialScanView,
    TriggerAppScanView,
    ImportCandidatesView,
    ManualCandidateSubmitView
)

urlpatterns = [
    path('social/', SocialMonitoringCandidateListView.as_view(), name='monitoring-social-candidates'),
    path('social/scan/', TriggerSocialScanView.as_view(), name='monitoring-social-scan'),
    path('apps/', AppStoreCandidateListView.as_view(), name='monitoring-app-candidates'),
    path('apps/scan/', TriggerAppScanView.as_view(), name='monitoring-app-scan'),
    path('sources/', DataSourceListView.as_view(), name='monitoring-sources'),
    path('sources/<int:pk>/', DataSourceUpdateView.as_view(), name='monitoring-source-update'),
    path('import/', ImportCandidatesView.as_view(), name='monitoring-import'),
    path('submit-candidate/', ManualCandidateSubmitView.as_view(), name='monitoring-submit-candidate'),
    path('scans/', ScanJobListView.as_view(), name='monitoring-scans-list'),
    path('scans/<uuid:pk>/', ScanJobDetailView.as_view(), name='monitoring-scans-detail'),
]
