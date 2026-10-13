from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, Organization, OrganizationMembership, Notification, AuditLog
from brands.models import Brand, OfficialBrandAsset
from monitoring.models import DataSource, ScanJob, SocialProfileCandidate, MobileAppCandidate
from monitoring.demo_dataset import initialize_data_sources, get_default_social_demo_candidates, get_default_app_demo_candidates
from monitoring.pipeline import process_social_candidate, process_app_candidate

class Command(BaseCommand):
    help = "Seeds initial demo organization, brand, assets, candidates, and detection intelligence."

    def handle(self, *args, **options):
        self.stdout.write("Initializing BrandShield AI demo environment...")

        # 1. Initialize data connectors
        initialize_data_sources()

        # 2. Create Demo User
        email = "analyst@brandshield.ai"
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                password="BrandShield@2026!",
                full_name="Alex Vance",
                mobile="+14155552671",
                is_active=True,
                is_email_verified=True,
                terms_consented=True
            )
            self.stdout.write(f"Created demo analyst: {email}")
        else:
            user.set_password("BrandShield@2026!")
            user.is_active = True
            user.is_email_verified = True
            user.save()

        # 3. Create Demo Organization
        org, _ = Organization.objects.get_or_create(
            slug="apex-financial",
            defaults={'name': "Apex Financial Group"}
        )

        OrganizationMembership.objects.get_or_create(
            user=user,
            organization=org,
            defaults={'role': OrganizationMembership.Role.ADMIN, 'is_active': True}
        )

        # 4. Create Protected Brand
        brand, _ = Brand.objects.get_or_create(
            organization=org,
            name="AcmePay",
            defaults={
                'website_url': "https://acmepay.com",
                'industry': "Financial Services & FinTech",
                'description': "AcmePay is a licensed multi-currency digital payment platform offering instant consumer payments, debit cards, and merchant checkouts.",
                'keywords': ["AcmePay", "Acme Pay", "AcmePay Wallet", "AcmePay Instant", "Acme-Pay"],
                'legitimate_domains': ["acmepay.com", "acmepay.io", "acme-financial.com"],
                'is_active': True
            }
        )

        # 5. Create Official Verified Assets
        OfficialBrandAsset.objects.get_or_create(
            brand=brand,
            platform=OfficialBrandAsset.Platform.TWITTER_X,
            identifier="acmepay",
            defaults={
                'asset_type': OfficialBrandAsset.AssetType.SOCIAL_ACCOUNT,
                'official_url': "https://x.com/acmepay",
                'is_verified': True,
                'verified_at': timezone.now(),
                'verified_by': user,
                'notes': "Official verified X brand handle"
            }
        )

        OfficialBrandAsset.objects.get_or_create(
            brand=brand,
            platform=OfficialBrandAsset.Platform.GOOGLE_PLAY,
            identifier="com.acmepay.wallet",
            defaults={
                'asset_type': OfficialBrandAsset.AssetType.MOBILE_APP,
                'official_url': "https://play.google.com/store/apps/details?id=com.acmepay.wallet",
                'publisher_or_developer_name': "Acme Financial Corp",
                'is_verified': True,
                'verified_at': timezone.now(),
                'verified_by': user,
                'notes': "Official Android payment application"
            }
        )

        # 6. Execute Initial Social Scan
        social_job = ScanJob.objects.create(
            organization=org,
            brand=brand,
            scan_type=ScanJob.ScanType.SOCIAL,
            status=ScanJob.ScanStatus.RUNNING,
            trigger_type=ScanJob.TriggerType.MANUAL
        )

        social_candidates = get_default_social_demo_candidates(brand.name, brand.website_url)
        social_threats = 0
        for item in social_candidates:
            cand, _ = SocialProfileCandidate.objects.update_or_create(
                brand=brand,
                platform=item['platform'],
                username=item['username'],
                defaults={
                    'scan_job': social_job,
                    'display_name': item['display_name'],
                    'profile_url': item['profile_url'],
                    'avatar_url': item.get('avatar_url', ''),
                    'bio': item.get('bio', ''),
                    'external_url': item.get('external_url', ''),
                    'followers_count': item.get('followers_count', 0),
                    'is_platform_verified': item.get('is_platform_verified', False)
                }
            )
            det = process_social_candidate(cand, brand, social_job)
            if det:
                social_threats += 1

        social_job.status = ScanJob.ScanStatus.COMPLETED
        social_job.total_candidates = len(social_candidates)
        social_job.potential_threats_found = social_threats
        social_job.completed_at = timezone.now()
        social_job.save()

        # 7. Execute Initial App Store Scan
        app_job = ScanJob.objects.create(
            organization=org,
            brand=brand,
            scan_type=ScanJob.ScanType.APP_STORE,
            status=ScanJob.ScanStatus.RUNNING,
            trigger_type=ScanJob.TriggerType.MANUAL
        )

        app_candidates = get_default_app_demo_candidates(brand.name, brand.website_url)
        app_threats = 0
        for item in app_candidates:
            cand, _ = MobileAppCandidate.objects.update_or_create(
                brand=brand,
                store=item['store'],
                package_id=item['package_id'],
                defaults={
                    'scan_job': app_job,
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
            det = process_app_candidate(cand, brand, app_job)
            if det:
                app_threats += 1

        app_job.status = ScanJob.ScanStatus.COMPLETED
        app_job.total_candidates = len(app_candidates)
        app_job.potential_threats_found = app_threats
        app_job.completed_at = timezone.now()
        app_job.save()

        # 8. Audit Log
        AuditLog.objects.create(
            user=user,
            organization=org,
            action="ENVIRONMENT_INITIALIZED",
            entity_type="System",
            details={"demo_seeded": True, "brand": brand.name}
        )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded BrandShield AI demo environment!\n"
            f"Demo credentials: {email} / BrandShield@2026!\n"
            f"Brand '{brand.name}' configured with {social_threats} social threats and {app_threats} app store threats."
        ))
