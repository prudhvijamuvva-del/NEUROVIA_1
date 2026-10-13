from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import DataSource, ScanJob, SocialProfileCandidate, MobileAppCandidate
from .serializers import (
    DataSourceSerializer,
    ScanJobSerializer,
    SocialProfileCandidateSerializer,
    MobileAppCandidateSerializer,
    CandidateImportSerializer,
    ManualCandidateSubmitSerializer
)
from brands.models import Brand
from accounts.models import AuditLog
from .pipeline import process_social_candidate, process_app_candidate
from .demo_dataset import (
    get_default_social_demo_candidates,
    get_default_app_demo_candidates,
    initialize_data_sources
)

def get_user_org(user):
    membership = user.memberships.filter(is_active=True).first()
    return membership.organization if membership else None

class DataSourceListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        initialize_data_sources()
        sources = DataSource.objects.all().order_by('platform_type', 'name')
        return Response(DataSourceSerializer(sources, many=True).data)

class DataSourceUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DataSourceSerializer
    queryset = DataSource.objects.all()

class ScanJobListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScanJobSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return ScanJob.objects.none()
        brand_id = self.request.query_params.get('brand_id')
        qs = ScanJob.objects.filter(organization=org)
        if brand_id:
            qs = qs.filter(brand_id=brand_id)
        return qs

class ScanJobDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScanJobSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        return ScanJob.objects.filter(organization=org)

class SocialMonitoringCandidateListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SocialProfileCandidateSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return SocialProfileCandidate.objects.none()
        brand_id = self.request.query_params.get('brand_id')
        qs = SocialProfileCandidate.objects.filter(brand__organization=org)
        if brand_id:
            qs = qs.filter(brand_id=brand_id)
        return qs

class AppStoreCandidateListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MobileAppCandidateSerializer

    def get_queryset(self):
        org = get_user_org(self.request.user)
        if not org:
            return MobileAppCandidate.objects.none()
        brand_id = self.request.query_params.get('brand_id')
        qs = MobileAppCandidate.objects.filter(brand__organization=org)
        if brand_id:
            qs = qs.filter(brand_id=brand_id)
        return qs

class TriggerSocialScanView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        org = get_user_org(request.user)
        brand_id = request.data.get('brand_id')
        if not brand_id:
            brand = Brand.objects.filter(organization=org).first()
            if not brand:
                return Response({'success': False, 'detail': 'Please create a brand profile before running a scan.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            brand = get_object_or_404(Brand, id=brand_id, organization=org)

        # Create ScanJob
        job = ScanJob.objects.create(
            organization=org,
            brand=brand,
            scan_type=ScanJob.ScanType.SOCIAL,
            status=ScanJob.ScanStatus.RUNNING,
            trigger_type=request.data.get('trigger_type', ScanJob.TriggerType.MANUAL)
        )

        # Generate candidates from demo data or configured connectors
        raw_candidates = get_default_social_demo_candidates(brand.name, brand.website_url)
        threats_count = 0

        for item in raw_candidates:
            candidate, _ = SocialProfileCandidate.objects.update_or_create(
                brand=brand,
                platform=item['platform'],
                username=item['username'],
                defaults={
                    'scan_job': job,
                    'display_name': item['display_name'],
                    'profile_url': item['profile_url'],
                    'avatar_url': item.get('avatar_url', ''),
                    'bio': item.get('bio', ''),
                    'external_url': item.get('external_url', ''),
                    'followers_count': item.get('followers_count', 0),
                    'is_platform_verified': item.get('is_platform_verified', False)
                }
            )

            detection = process_social_candidate(candidate, brand, job)
            if detection:
                threats_count += 1

        job.status = ScanJob.ScanStatus.COMPLETED
        job.total_candidates = len(raw_candidates)
        job.potential_threats_found = threats_count
        job.completed_at = timezone.now()
        job.save()

        AuditLog.objects.create(
            user=request.user,
            organization=org,
            action="SOCIAL_SCAN_EXECUTED",
            entity_type="ScanJob",
            entity_id=str(job.id),
            details={"brand": brand.name, "threats_found": threats_count}
        )

        return Response({
            'success': True,
            'message': f"Social scan completed for {brand.name}. {threats_count} potential threat(s) detected across {len(raw_candidates)} profiles.",
            'scan_job': ScanJobSerializer(job).data
        })

class TriggerAppScanView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        org = get_user_org(request.user)
        brand_id = request.data.get('brand_id')
        if not brand_id:
            brand = Brand.objects.filter(organization=org).first()
            if not brand:
                return Response({'success': False, 'detail': 'Please create a brand profile before running a scan.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            brand = get_object_or_404(Brand, id=brand_id, organization=org)

        job = ScanJob.objects.create(
            organization=org,
            brand=brand,
            scan_type=ScanJob.ScanType.APP_STORE,
            status=ScanJob.ScanStatus.RUNNING,
            trigger_type=request.data.get('trigger_type', ScanJob.TriggerType.MANUAL)
        )

        raw_candidates = get_default_app_demo_candidates(brand.name, brand.website_url)
        threats_count = 0

        for item in raw_candidates:
            candidate, _ = MobileAppCandidate.objects.update_or_create(
                brand=brand,
                store=item['store'],
                package_id=item['package_id'],
                defaults={
                    'scan_job': job,
                    'app_name': item['app_name'],
                    'developer_name': item['developer_name'],
                    'store_url': item['store_url'],
                    'icon_url': item.get('icon_url', ''),
                    'description': item.get('description', ''),
                    'permissions': item.get('permissions', []),
                    'developer_website': item.get('developer_website', ''),
                    'rating': item.get('rating', 0.0),
                    'downloads_count': item.get('downloads_count', '')
                }
            )

            detection = process_app_candidate(candidate, brand, job)
            if detection:
                threats_count += 1

        job.status = ScanJob.ScanStatus.COMPLETED
        job.total_candidates = len(raw_candidates)
        job.potential_threats_found = threats_count
        job.completed_at = timezone.now()
        job.save()

        AuditLog.objects.create(
            user=request.user,
            organization=org,
            action="APP_STORE_SCAN_EXECUTED",
            entity_type="ScanJob",
            entity_id=str(job.id),
            details={"brand": brand.name, "threats_found": threats_count}
        )

        return Response({
            'success': True,
            'message': f"App store scan completed for {brand.name}. {threats_count} potential threat(s) detected across {len(raw_candidates)} mobile listings.",
            'scan_job': ScanJobSerializer(job).data
        })

class ImportCandidatesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CandidateImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        org = get_user_org(request.user)
        brand = get_object_or_404(Brand, id=serializer.validated_data['brand_id'], organization=org)
        import_type = serializer.validated_data['import_type']
        records = serializer.validated_data['records']

        threats_created = 0
        for rec in records:
            if import_type == 'SOCIAL':
                cand, _ = SocialProfileCandidate.objects.update_or_create(
                    brand=brand,
                    platform=rec.get('platform', 'Other'),
                    username=rec.get('username', 'candidate'),
                    defaults={
                        'display_name': rec.get('display_name', rec.get('username', '')),
                        'profile_url': rec.get('profile_url', 'https://example.com'),
                        'avatar_url': rec.get('avatar_url', ''),
                        'bio': rec.get('bio', ''),
                        'external_url': rec.get('external_url', ''),
                        'followers_count': rec.get('followers_count', 0),
                        'is_platform_verified': rec.get('is_platform_verified', False)
                    }
                )
                det = process_social_candidate(cand, brand)
                if det:
                    threats_created += 1
            else:
                cand, _ = MobileAppCandidate.objects.update_or_create(
                    brand=brand,
                    store=rec.get('store', 'Google Play Store'),
                    package_id=rec.get('package_id', 'com.example.app'),
                    defaults={
                        'app_name': rec.get('app_name', 'Example App'),
                        'developer_name': rec.get('developer_name', 'Unknown Dev'),
                        'store_url': rec.get('store_url', 'https://example.com'),
                        'icon_url': rec.get('icon_url', ''),
                        'description': rec.get('description', ''),
                        'developer_website': rec.get('developer_website', '')
                    }
                )
                det = process_app_candidate(cand, brand)
                if det:
                    threats_created += 1

        return Response({
            'success': True,
            'message': f"Imported {len(records)} candidate record(s). Pipeline generated {threats_created} threat finding(s)."
        })

class ManualCandidateSubmitView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ManualCandidateSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        org = get_user_org(request.user)
        data = serializer.validated_data
        brand = get_object_or_404(Brand, id=data['brand_id'], organization=org)

        if data['candidate_type'] == 'SOCIAL':
            cand, _ = SocialProfileCandidate.objects.update_or_create(
                brand=brand,
                platform=data['platform_or_store'],
                username=data['identifier'].lstrip('@'),
                defaults={
                    'display_name': data['target_name'],
                    'profile_url': data['url'],
                    'bio': data.get('bio_or_description', ''),
                    'external_url': data.get('external_url', '')
                }
            )
            detection = process_social_candidate(cand, brand)
        else:
            cand, _ = MobileAppCandidate.objects.update_or_create(
                brand=brand,
                store=data['platform_or_store'],
                package_id=data['identifier'],
                defaults={
                    'app_name': data['target_name'],
                    'developer_name': data.get('developer_or_publisher', 'Independent Developer'),
                    'store_url': data['url'],
                    'description': data.get('bio_or_description', ''),
                    'developer_website': data.get('external_url', '')
                }
            )
            detection = process_app_candidate(cand, brand)

        return Response({
            'success': True,
            'message': "Candidate submitted and analyzed successfully.",
            'detection_generated': bool(detection),
            'threat_id': str(detection.id) if detection else None
        })
