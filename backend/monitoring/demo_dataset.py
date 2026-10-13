from .models import SocialProfileCandidate, MobileAppCandidate, DataSource

def get_default_social_demo_candidates(brand_name: str, brand_website: str):
    slug = brand_name.lower().replace(' ', '')
    return [
        {
            'platform': 'Instagram',
            'username': f"{slug}_official_help",
            'display_name': f"{brand_name} Support & Helpdesk",
            'profile_url': f"https://instagram.com/{slug}_official_help",
            'avatar_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'bio': f"Official 24/7 customer care and dispute resolution for all {brand_name} accounts. Click link below for fast KYC verification.",
            'external_url': f"https://{slug}-security-portal.xyz/login",
            'followers_count': 142,
            'is_platform_verified': False
        },
        {
            'platform': 'X (Twitter)',
            'username': f"{slug}care_desk",
            'display_name': f"{brand_name} Customer Care",
            'profile_url': f"https://x.com/{slug}care_desk",
            'avatar_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'bio': f"Direct support agent team assisting {brand_name} clients with payment reversals and transaction errors. Send DM for instant assistance.",
            'external_url': 'https://bit.ly/instant-resolution-chat',
            'followers_count': 23,
            'is_platform_verified': False
        },
        {
            'platform': 'Facebook',
            'username': f"{slug}.verification.global",
            'display_name': f"{brand_name} Global Security",
            'profile_url': f"https://facebook.com/{slug}.verification.global",
            'avatar_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'bio': f"Official Facebook portal for {brand_name}. Notice: Update your account details immediately to prevent temporary suspension.",
            'external_url': f"https://login-{slug}-auth.top",
            'followers_count': 340,
            'is_platform_verified': False
        },
        {
            'platform': 'LinkedIn',
            'username': f"{slug}-recruitment-consultants",
            'display_name': f"{brand_name} Talent Acquisition Partner",
            'profile_url': f"https://linkedin.com/company/{slug}-recruitment-consultants",
            'avatar_url': '',
            'bio': f"Independent hiring agency recruiting contractors for projects associated with {brand_name} platforms.",
            'external_url': 'https://recruitment-careers-board.com',
            'followers_count': 1200,
            'is_platform_verified': False
        },
        {
            'platform': 'YouTube',
            'username': f"{slug}_tutorial_channel",
            'display_name': f"{brand_name} Community Guides",
            'profile_url': f"https://youtube.com/@{slug}_tutorial_channel",
            'avatar_url': '',
            'bio': f"Community walkthroughs and unofficial tips for users of {brand_name} software.",
            'external_url': 'https://community-forums-discuss.org',
            'followers_count': 5400,
            'is_platform_verified': False
        },
        {
            'platform': 'TikTok',
            'username': f"official_{slug}_promos",
            'display_name': f"{brand_name} Giveaways Official",
            'profile_url': f"https://tiktok.com/@official_{slug}_promos",
            'avatar_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'bio': f"Official promotional partner for {brand_name}! Claim your $250 promotional voucher today through our link.",
            'external_url': f"https://claim-{slug}-reward.cam",
            'followers_count': 89,
            'is_platform_verified': False
        }
    ]

def get_default_app_demo_candidates(brand_name: str, brand_website: str):
    slug = brand_name.lower().replace(' ', '')
    return [
        {
            'store': 'Google Play Store',
            'app_name': f"{brand_name}: Quick Mobile Access & Balance",
            'developer_name': f"{brand_name} Global App Studios",
            'package_id': f"com.fastaccess.{slug}.client",
            'store_url': f"https://play.google.com/store/apps/details?id=com.fastaccess.{slug}.client",
            'icon_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'description': f"Access your {brand_name} balance, transfer money, and manage tokens with our streamlined companion tool. Unofficial utility application.",
            'permissions': ['READ_SMS', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS'],
            'developer_website': f"https://{slug}-appsupport.xyz",
            'rating': 2.1,
            'downloads_count': '5,000+'
        },
        {
            'store': 'Apple App Store',
            'app_name': f"{brand_name} Authenticator Helper",
            'developer_name': "Digital Security Soft LLC",
            'package_id': f"org.authenticator.{slug}.ios",
            'store_url': f"https://apps.apple.com/app/{slug}-authenticator-helper/id159483011",
            'icon_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            'description': f"Security utility for {brand_name} two-step verification backup and token generator.",
            'permissions': ['CAMERA', 'FACE_ID'],
            'developer_website': 'https://digitalsecuritysoft.net',
            'rating': 3.4,
            'downloads_count': '1,200+'
        },
        {
            'store': 'Google Play Store',
            'app_name': f"{brand_name} Rewards & Cash",
            'developer_name': "SuperPromo Gaming Network",
            'package_id': f"net.promonetwork.{slug}bonus",
            'store_url': f"https://play.google.com/store/apps/details?id=net.promonetwork.{slug}bonus",
            'icon_url': '',
            'description': f"Earn promotional coupons and cash back redeemable on your favorite {brand_name} shopping merchant transactions.",
            'permissions': ['ACCESS_COARSE_LOCATION'],
            'developer_website': 'https://promonetwork.cc',
            'rating': 4.0,
            'downloads_count': '50,000+'
        }
    ]

def initialize_data_sources():
    """Initializes standard platform data connectors."""
    sources = [
        ('INSTAGRAM', 'Instagram Graph & Profile API', 'SOCIAL', 'DEMO_DATA', '200 requests/hour'),
        ('FACEBOOK', 'Meta Brand Protection Search', 'SOCIAL', 'DEMO_DATA', '200 requests/hour'),
        ('TWITTER_X', 'X (Twitter) Compliance API v2', 'SOCIAL', 'DEMO_DATA', '300 requests/15m'),
        ('LINKEDIN', 'LinkedIn Organization Search', 'SOCIAL', 'DEMO_DATA', '100 requests/day'),
        ('YOUTUBE', 'YouTube Data v3 API', 'SOCIAL', 'DEMO_DATA', '10,000 quota/day'),
        ('TIKTOK', 'TikTok Research & Video Search API', 'SOCIAL', 'DEMO_DATA', '50 requests/hour'),
        ('GOOGLE_PLAY', 'Google Play Developer & Scraper Connector', 'APP_STORE', 'DEMO_DATA', '60 requests/hour'),
        ('APPLE_APP_STORE', 'Apple iTunes Search & Storefront API', 'APP_STORE', 'DEMO_DATA', '100 requests/hour'),
    ]

    for sid, name, ptype, status, rlimit in sources:
        DataSource.objects.get_or_create(
            source_id=sid,
            defaults={
                'name': name,
                'platform_type': ptype,
                'status': status,
                'rate_limit_info': rlimit,
                'is_enabled': True
            }
        )
