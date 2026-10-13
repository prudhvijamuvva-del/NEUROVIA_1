import csv
from django.http import HttpResponse
from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from brands.models import Brand
from monitoring.models import ScanJob, SocialProfileCandidate, MobileAppCandidate, DataSource
from investigations.models import Detection
from investigations.serializers import DetectionSerializer

def get_user_org(user):
    membership = user.memberships.filter(is_active=True).first()
    return membership.organization if membership else None

class DashboardSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = get_user_org(request.user)
        if not org:
            return Response({'error': 'Organization not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic counters
        total_brands = Brand.objects.filter(organization=org, is_active=True).count()
        social_scanned = SocialProfileCandidate.objects.filter(brand__organization=org).count()
        apps_scanned = MobileAppCandidate.objects.filter(brand__organization=org).count()
        
        detections_qs = Detection.objects.filter(organization=org)
        total_threats = detections_qs.count()

        # Severity counts
        severity_counts = {
            'CRITICAL': detections_qs.filter(severity='CRITICAL').count(),
            'HIGH': detections_qs.filter(severity='HIGH').count(),
            'MEDIUM': detections_qs.filter(severity='MEDIUM').count(),
            'LOW': detections_qs.filter(severity='LOW').count(),
        }

        # Status counts
        status_counts = {
            'NEW': detections_qs.filter(status='NEW').count(),
            'INVESTIGATING': detections_qs.filter(status='INVESTIGATING').count(),
            'CONFIRMED': detections_qs.filter(status='CONFIRMED').count(),
            'FALSE_POSITIVE': detections_qs.filter(status='FALSE_POSITIVE').count(),
            'RESOLVED': detections_qs.filter(status='RESOLVED').count(),
        }

        # Platform distribution
        platform_dist = detections_qs.values('platform_or_store').annotate(count=Count('id')).order_by('-count')

        # Social vs App store
        social_threats = detections_qs.filter(detection_type='SOCIAL_PROFILE').count()
        app_threats = detections_qs.filter(detection_type='MOBILE_APP').count()

        # Scan stats
        last_scan = ScanJob.objects.filter(organization=org).order_by('-started_at').first()
        last_scan_data = {
            'scan_type': last_scan.scan_type,
            'status': last_scan.status,
            'completed_at': last_scan.completed_at or last_scan.started_at,
            'threats_found': last_scan.potential_threats_found,
            'total_candidates': last_scan.total_candidates
        } if last_scan else None

        # Source availability
        sources = DataSource.objects.all()
        source_summary = {
            'live_api': sources.filter(status='LIVE_API').count(),
            'demo_data': sources.filter(status='DEMO_DATA').count(),
            'unavailable': sources.filter(status='UNAVAILABLE').count(),
            'total': sources.count()
        }

        # Recent detections
        recent = detections_qs.order_by('-created_at')[:8]

        # Threat trend over past 7 days (simulated or real from timestamps)
        now = timezone.now()
        trend_days = []
        for i in range(6, -1, -1):
            day_start = now - timedelta(days=i)
            day_label = day_start.strftime('%b %d')
            count = detections_qs.filter(created_at__date=day_start.date()).count()
            trend_days.append({'date': day_label, 'count': count})

        return Response({
            'success': True,
            'total_brands': total_brands,
            'social_profiles_scanned': social_scanned,
            'apps_scanned': apps_scanned,
            'total_threats': total_threats,
            'severity_counts': severity_counts,
            'status_counts': status_counts,
            'platform_distribution': list(platform_dist),
            'type_comparison': [
                {'name': 'Social Media', 'value': social_threats, 'color': '#0284c7'},
                {'name': 'App Stores', 'value': app_threats, 'color': '#14b8a6'}
            ],
            'recent_detections': DetectionSerializer(recent, many=True).data,
            'last_scan': last_scan_data,
            'source_summary': source_summary,
            'threat_trends': trend_days
        })

class ReportSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = get_user_org(request.user)
        time_period = request.query_params.get('period', '30d')

        days = 30
        if time_period == '7d':
            days = 7
        elif time_period == '90d':
            days = 90
        elif time_period == 'all':
            days = 365

        start_date = timezone.now() - timedelta(days=days)
        qs = Detection.objects.filter(organization=org, created_at__gte=start_date)

        total = qs.count()
        fp_count = qs.filter(status='FALSE_POSITIVE').count()
        fp_rate = round((fp_count / total * 100), 1) if total > 0 else 0.0

        resolved = qs.filter(status='RESOLVED').count()
        resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

        return Response({
            'time_period': time_period,
            'total_detected': total,
            'false_positive_count': fp_count,
            'false_positive_rate_percent': fp_rate,
            'resolved_count': resolved,
            'resolution_rate_percent': resolution_rate,
            'severity_breakdown': {
                'critical': qs.filter(severity='CRITICAL').count(),
                'high': qs.filter(severity='HIGH').count(),
                'medium': qs.filter(severity='MEDIUM').count(),
                'low': qs.filter(severity='LOW').count(),
            }
        })

class ExportThreatsCSVView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = get_user_org(request.user)
        detections = Detection.objects.filter(organization=org).order_by('-risk_score')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="brandshield-threats-{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Threat ID', 'Protected Brand', 'Detection Type', 'Target Name',
            'Platform/Store', 'Target URL', 'Risk Score', 'Severity',
            'Status', 'Name Score', 'Logo Score', 'Domain Score', 'First Seen', 'Last Seen'
        ])

        for d in detections:
            writer.writerow([
                str(d.id),
                d.brand.name,
                d.detection_type,
                d.target_name,
                d.platform_or_store,
                d.target_url,
                d.risk_score,
                d.severity,
                d.status,
                d.name_score,
                d.logo_score or 'N/A',
                d.domain_score or 'N/A',
                d.first_seen_at.strftime('%Y-%m-%d %H:%M'),
                d.last_seen_at.strftime('%Y-%m-%d %H:%M')
            ])

        return response
