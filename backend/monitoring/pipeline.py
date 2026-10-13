import logging
from django.utils import timezone
from brands.models import Brand, OfficialBrandAsset
from detection.lookalike import analyze_lookalike_name
from detection.image_matcher import compare_logos
from detection.text_matcher import analyze_text_similarity
from detection.domain_analyzer import analyze_domain_and_publisher
from detection.scoring_engine import calculate_risk_score
from detection.ai_explainer import generate_ai_threat_explanation
from investigations.models import Detection, DetectionEvidence
from accounts.models import Notification

logger = logging.getLogger(__name__)

PLATFORM_REPORT_URLS = {
    'INSTAGRAM': 'https://help.instagram.com/contact/636276399721841',
    'FACEBOOK': 'https://www.facebook.com/help/contact/208282075859016',
    'TWITTER_X': 'https://help.twitter.com/forms/impersonation',
    'LINKEDIN': 'https://www.linkedin.com/help/linkedin/ask/TS-NPI',
    'YOUTUBE': 'https://www.youtube.com/reportabuse',
    'TIKTOK': 'https://www.tiktok.com/legal/report/feedback',
    'GOOGLE_PLAY': 'https://support.google.com/googleplay/android-developer/contact/takedown',
    'APPLE_APP_STORE': 'https://www.apple.com/legal/intellectual-property/trademark/appstore/'
}

def is_verified_official_asset(brand: Brand, identifier: str, official_url: str = "") -> bool:
    """Strictly checks if candidate belongs to registered verified official assets."""
    clean_id = identifier.lower().strip().lstrip('@')
    verified_assets = brand.official_assets.filter(is_verified=True)
    for asset in verified_assets:
        asset_id = asset.identifier.lower().strip().lstrip('@')
        if clean_id and asset_id and clean_id == asset_id:
            return True
        if official_url and asset.official_url and official_url.lower().rstrip('/') == asset.official_url.lower().rstrip('/'):
            return True
    return False

def process_social_candidate(candidate, brand: Brand, scan_job=None) -> Detection | None:
    """Evaluates a social media candidate profile through the complete detection pipeline."""
    # Check official asset exclusion
    if is_verified_official_asset(brand, candidate.username, candidate.profile_url):
        candidate.is_official_asset = True
        candidate.save(update_fields=['is_official_asset'])
        return None

    # 1. Look-alike name analysis (both username and display_name)
    user_name_match = analyze_lookalike_name(candidate.username, brand.name, brand.keywords)
    disp_name_match = analyze_lookalike_name(candidate.display_name, brand.name, brand.keywords)
    name_analysis = disp_name_match if disp_name_match['similarity_score'] >= user_name_match['similarity_score'] else user_name_match

    # 2. Image / Logo comparison
    logo_analysis = compare_logos(candidate.avatar_url, brand.logo, brand.logo_hash)

    # 3. Description / Bio text similarity
    text_analysis = analyze_text_similarity(candidate.bio, brand.description, brand.keywords)

    # 4. Domain & External link analysis
    domain_analysis = analyze_domain_and_publisher(
        external_url=candidate.external_url,
        brand_name=brand.name,
        legitimate_domains=brand.legitimate_domains
    )

    # 5. Contextual heuristic signals
    context_signals = {
        'is_new_account_claiming_official': text_analysis.get('claimed_affiliation') and (candidate.followers_count or 0) < 500,
        'zero_or_low_followers_with_high_similarity': (candidate.followers_count or 0) < 100 and name_analysis['similarity_score'] > 80,
        'is_unverified_claiming_official': not candidate.is_platform_verified and text_analysis.get('claimed_affiliation')
    }

    # 6. Comprehensive Risk Scoring
    risk_assessment = calculate_risk_score(
        name_analysis=name_analysis,
        logo_analysis=logo_analysis,
        text_analysis=text_analysis,
        domain_analysis=domain_analysis,
        contextual_signals=context_signals
    )

    score = risk_assessment['overall_score']
    # Threshold for creating a threat alert: 20 or higher
    if score < 20 and not name_analysis.get('meets_threshold'):
        return None

    # 7. AI Threat Explanation
    ai_expl = generate_ai_threat_explanation(
        target_name=candidate.display_name or candidate.username,
        brand_name=brand.name,
        platform_or_store=candidate.platform,
        risk_assessment=risk_assessment,
        detection_type="SOCIAL_PROFILE"
    )

    platform_key = candidate.platform.upper().replace(' ', '_').replace('X_(TWITTER)', 'TWITTER_X').replace('TWITTER', 'TWITTER_X')
    reporting_url = PLATFORM_REPORT_URLS.get(platform_key, "https://support.google.com")

    # 8. Create or update Detection
    detection, created = Detection.objects.update_or_create(
        organization=brand.organization,
        brand=brand,
        social_candidate=candidate,
        defaults={
            'detection_type': Detection.DetectionType.SOCIAL_PROFILE,
            'target_name': candidate.display_name or candidate.username,
            'target_identifier': f"@{candidate.username}",
            'platform_or_store': candidate.platform,
            'target_url': candidate.profile_url,
            'target_image_url': candidate.avatar_url,
            'risk_score': score,
            'severity': risk_assessment['severity'],
            'confidence': risk_assessment['confidence'],
            'name_score': name_analysis['similarity_score'],
            'logo_score': logo_analysis.get('similarity_score'),
            'desc_score': text_analysis.get('similarity_score'),
            'publisher_score': 0.0,
            'domain_score': domain_analysis.get('risk_score'),
            'ai_explanation': ai_expl,
            'score_breakdown': risk_assessment['score_breakdown'],
            'official_reporting_url': reporting_url
        }
    )

    # Save evidence items
    detection.evidences.all().delete()
    for ev in risk_assessment['supporting_evidence']:
        DetectionEvidence.objects.create(
            detection=detection,
            category=ev.get('category', 'CONTEXTUAL'),
            title=ev.get('title', 'Evidence Record'),
            details=ev.get('details', ''),
            score_contribution=ev.get('score_contribution'),
            method=ev.get('method', '')
        )

    # Alert notification on High or Critical risk
    if risk_assessment['severity'] in ['HIGH', 'CRITICAL'] and created:
        Notification.objects.create(
            organization=brand.organization,
            title=f"Potential Impersonation Alert: {detection.target_name}",
            message=f"High risk ({score}/100) detected on {candidate.platform} mimicking {brand.name}.",
            severity=Notification.Severity.CRITICAL if risk_assessment['severity'] == 'CRITICAL' else Notification.Severity.WARNING,
            threat_id=str(detection.id)
        )

    return detection

def process_app_candidate(candidate, brand: Brand, scan_job=None) -> Detection | None:
    """Evaluates a mobile app candidate through the complete detection pipeline."""
    # Check official asset exclusion
    if is_verified_official_asset(brand, candidate.package_id, candidate.store_url):
        candidate.is_official_asset = True
        candidate.save(update_fields=['is_official_asset'])
        return None

    # 1. Look-alike name analysis
    name_analysis = analyze_lookalike_name(candidate.app_name, brand.name, brand.keywords)

    # 2. Image / Icon comparison
    logo_analysis = compare_logos(candidate.icon_url, brand.logo, brand.logo_hash)

    # 3. Description text similarity
    text_analysis = analyze_text_similarity(candidate.description, brand.description, brand.keywords)

    # 4. Publisher & Package & Domain analysis
    official_publishers = [a.publisher_or_developer_name for a in brand.official_assets.all() if a.publisher_or_developer_name]
    domain_analysis = analyze_domain_and_publisher(
        external_url=candidate.developer_website,
        candidate_publisher=candidate.developer_name,
        candidate_package_id=candidate.package_id,
        brand_name=brand.name,
        legitimate_domains=brand.legitimate_domains,
        official_publishers=official_publishers
    )

    # 5. Contextual signals
    context_signals = {
        'is_new_account_claiming_official': text_analysis.get('claimed_affiliation') and domain_analysis.get('is_publisher_mismatch'),
        'zero_or_low_followers_with_high_similarity': (candidate.rating or 0) < 3.0 and name_analysis['similarity_score'] > 75,
        'is_unverified_claiming_official': domain_analysis.get('is_publisher_mismatch')
    }

    # 6. Risk Scoring
    risk_assessment = calculate_risk_score(
        name_analysis=name_analysis,
        logo_analysis=logo_analysis,
        text_analysis=text_analysis,
        domain_analysis=domain_analysis,
        contextual_signals=context_signals
    )

    score = risk_assessment['overall_score']
    if score < 20 and not name_analysis.get('meets_threshold'):
        return None

    # 7. AI Threat Explanation
    ai_expl = generate_ai_threat_explanation(
        target_name=candidate.app_name,
        brand_name=brand.name,
        platform_or_store=candidate.store,
        risk_assessment=risk_assessment,
        detection_type="MOBILE_APP"
    )

    store_key = 'GOOGLE_PLAY' if 'google' in candidate.store.lower() else 'APPLE_APP_STORE'
    reporting_url = PLATFORM_REPORT_URLS.get(store_key, "https://support.google.com")

    # 8. Create or update Detection
    detection, created = Detection.objects.update_or_create(
        organization=brand.organization,
        brand=brand,
        app_candidate=candidate,
        defaults={
            'detection_type': Detection.DetectionType.MOBILE_APP,
            'target_name': candidate.app_name,
            'target_identifier': candidate.package_id,
            'platform_or_store': candidate.store,
            'target_url': candidate.store_url,
            'target_image_url': candidate.icon_url,
            'risk_score': score,
            'severity': risk_assessment['severity'],
            'confidence': risk_assessment['confidence'],
            'name_score': name_analysis['similarity_score'],
            'logo_score': logo_analysis.get('similarity_score'),
            'desc_score': text_analysis.get('similarity_score'),
            'publisher_score': 80.0 if domain_analysis.get('is_publisher_mismatch') else 10.0,
            'domain_score': domain_analysis.get('risk_score'),
            'ai_explanation': ai_expl,
            'score_breakdown': risk_assessment['score_breakdown'],
            'official_reporting_url': reporting_url
        }
    )

    detection.evidences.all().delete()
    for ev in risk_assessment['supporting_evidence']:
        DetectionEvidence.objects.create(
            detection=detection,
            category=ev.get('category', 'CONTEXTUAL'),
            title=ev.get('title', 'Evidence Record'),
            details=ev.get('details', ''),
            score_contribution=ev.get('score_contribution'),
            method=ev.get('method', '')
        )

    if risk_assessment['severity'] in ['HIGH', 'CRITICAL'] and created:
        Notification.objects.create(
            organization=brand.organization,
            title=f"Potential Malicious App Detected: {candidate.app_name}",
            message=f"High risk application ({score}/100) identified on {candidate.store}.",
            severity=Notification.Severity.CRITICAL if risk_assessment['severity'] == 'CRITICAL' else Notification.Severity.WARNING,
            threat_id=str(detection.id)
        )

    return detection
