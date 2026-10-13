from django.urls import path
from .views import (
    DetectionListView,
    DetectionDetailView,
    AddInvestigationNoteView,
    NotificationListView,
    NotificationMarkAllReadView,
    AuditLogListView
)

urlpatterns = [
    path('detections/', DetectionListView.as_view(), name='detections-list'),
    path('detections/<uuid:pk>/', DetectionDetailView.as_view(), name='detections-detail'),
    path('detections/<uuid:pk>/notes/', AddInvestigationNoteView.as_view(), name='detections-add-note'),
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notifications-read-all'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
]
