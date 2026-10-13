from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Detection, InvestigationNote
from .serializers import DetectionSerializer, DetectionUpdateSerializer, InvestigationNoteSerializer
from accounts.models import AuditLog, Notification
from accounts.serializers import NotificationSerializer, AuditLogSerializer

def get_user_org(user):
    membership = user.memberships.filter(is_active=True).first()
    return membership.organization if membership else None

class DetectionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DetectionSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return Detection.objects.none()

        qs = Detection.objects.filter(organization=org)

        brand_id = self.request.query_params.get('brand_id')
        if brand_id:
            qs = qs.filter(brand_id=brand_id)

        det_type = self.request.query_params.get('type')
        if det_type:
            qs = qs.filter(detection_type=det_type)

        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity.upper())

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())

        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(target_name__icontains=q) |
                Q(target_identifier__icontains=q) |
                Q(platform_or_store__icontains=q)
            )

        return qs

class DetectionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return DetectionUpdateSerializer
        return DetectionSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        return Detection.objects.filter(organization=org)

    def perform_update(self, serializer):
        prev_status = serializer.instance.status
        instance = serializer.save()
        new_status = instance.status

        if prev_status != new_status:
            action_name = "DETECTION_STATUS_CHANGED"
            if new_status == 'FALSE_POSITIVE':
                action_name = "DETECTION_MARKED_FALSE_POSITIVE"
            elif new_status == 'CONFIRMED':
                action_name = "DETECTION_CONFIRMED_THREAT"
            elif new_status == 'RESOLVED':
                action_name = "DETECTION_RESOLVED"

            AuditLog.objects.create(
                user=self.request.user,
                organization=instance.organization,
                action=action_name,
                entity_type="Detection",
                entity_id=str(instance.id),
                details={
                    "target_name": instance.target_name,
                    "previous_status": prev_status,
                    "new_status": new_status,
                    "notes": instance.resolution_notes
                }
            )

class AddInvestigationNoteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        org = get_user_org(request.user)
        detection = get_object_or_404(Detection, id=pk, organization=org)
        note_text = request.data.get('note_text', '').strip()

        if not note_text:
            return Response({'success': False, 'detail': 'Note text cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        note = InvestigationNote.objects.create(
            detection=detection,
            author=request.user,
            note_text=note_text
        )

        AuditLog.objects.create(
            user=request.user,
            organization=org,
            action="INVESTIGATION_NOTE_ADDED",
            entity_type="Detection",
            entity_id=str(detection.id),
            details={"note_snippet": note_text[:100]}
        )

        return Response(InvestigationNoteSerializer(note).data, status=status.HTTP_201_CREATED)

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return Notification.objects.none()
        return Notification.objects.filter(organization=org)

class NotificationMarkAllReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        org = get_user_org(request.user)
        Notification.objects.filter(organization=org, is_read=False).update(is_read=True)
        return Response({'success': True, 'message': 'All notifications marked as read.'})

class AuditLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return AuditLog.objects.none()
        return AuditLog.objects.filter(organization=org)[:100]
