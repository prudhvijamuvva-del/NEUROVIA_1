import logging
from .lookalike import analyze_lookalike_name
from .image_matcher import compare_logos
from .text_matcher import analyze_text_similarity
from .domain_analyzer import analyze_domain_and_publisher

logger = logging.getLogger(__name__)

# Configurable default weights (sum to 1.0)
DEFAULT_WEIGHTS = {
    'name': 0.25,
    'logo': 0.20,
    'description': 0.15,
    'publisher_identity': 0.15,
    'domain_mismatch': 0.15,
    'contextual': 0.10
}

SEVERITY_BANDS = [
    (75, 100, 'CRITICAL', 'Urgent priority: Strong multi-signal alignment with brand impersonation patterns.'),
    (50, 74, 'HIGH', 'High priority: Multiple suspicious indicators present requiring analyst review.'),
    (30, 49, 'MEDIUM', 'Medium priority: Look-alike similarities present; potential partner, fan page, or low-evidence anomaly.'),
    (0, 29, 'LOW', 'Low priority: Incidental name overlap with low likelihood of impersonation.')
]

def calculate_risk_score(
    name_analysis: dict,
    logo_analysis: dict,
    text_analysis: dict,
    domain_analysis: dict,
    contextual_signals: dict = None,
    weights: dict = None
) -> dict:
    """
    Computes transparent, normalized weighted risk score (0-100) with full evidence accounting.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS.copy()
    if contextual_signals is None:
        contextual_signals = {}

    evidence_records = []
    missing_evidence = []
    main_reasons = []

    active_weights = {}
    component_scores = {}

    # 1. Name Similarity (25%)
    name_score = name_analysis.get('similarity_score', 0.0)
    component_scores['name'] = name_score
    active_weights['name'] = weights['name']
    
    if name_analysis.get('meets_threshold', False):
        main_reasons.append(name_analysis.get('match_explanation'))
    evidence_records.append({
        'category': 'NAME_SIMILARITY',
        'title': f"Name match: {name_analysis.get('original_name')}",
        'score_contribution': name_score,
        'details': name_analysis.get('match_explanation'),
        'method': name_analysis.get('matching_method')
    })

    # 2. Logo / Icon Similarity (20%)
    if logo_analysis.get('is_available') and logo_analysis.get('similarity_score') is not None:
        logo_score = logo_analysis['similarity_score']
        component_scores['logo'] = logo_score
        active_weights['logo'] = weights['logo']
        if logo_score >= 60:
            main_reasons.append(logo_analysis.get('explanation'))
        evidence_records.append({
            'category': 'LOGO_SIMILARITY',
            'title': 'Visual logo / icon correlation',
            'score_contribution': logo_score,
            'details': logo_analysis.get('explanation'),
            'method': logo_analysis.get('method')
        })
    else:
        missing_evidence.append({
            'category': 'LOGO_SIMILARITY',
            'reason': logo_analysis.get('explanation', 'Image data unavailable for visual comparison.')
        })

    # 3. Description / Bio Similarity (15%)
    if text_analysis.get('is_available') and text_analysis.get('similarity_score') is not None:
        desc_score = text_analysis['similarity_score']
        component_scores['description'] = desc_score
        active_weights['description'] = weights['description']
        if desc_score >= 40:
            main_reasons.append(text_analysis.get('explanation'))
        evidence_records.append({
            'category': 'DESCRIPTION',
            'title': 'Biography & description analysis',
            'score_contribution': desc_score,
            'details': text_analysis.get('explanation'),
            'method': 'TF-IDF Cosine & Affiliation Patterns'
        })
    else:
        missing_evidence.append({
            'category': 'DESCRIPTION',
            'reason': text_analysis.get('explanation', 'Profile description/bio not available.')
        })

    # 4. Publisher / Identity Mismatch (15%)
    pub_score = 0.0
    if domain_analysis.get('is_publisher_mismatch'):
        pub_score = 80.0
        main_reasons.append("Publisher / developer name differs from official registered brand entity.")
    elif domain_analysis.get('is_publisher_matched'):
        pub_score = 10.0
    
    if domain_analysis.get('publisher_evaluated'):
        component_scores['publisher_identity'] = pub_score
        active_weights['publisher_identity'] = weights['publisher_identity']
        evidence_records.append({
            'category': 'PUBLISHER_IDENTITY',
            'title': 'Publisher identity validation',
            'score_contribution': pub_score,
            'details': f"Publisher evaluated: {domain_analysis.get('publisher_evaluated')}",
            'method': 'Entity Registry Lookup'
        })
    else:
        missing_evidence.append({
            'category': 'PUBLISHER_IDENTITY',
            'reason': 'Publisher or developer metadata not applicable or not provided.'
        })

    # 5. Domain Mismatch / External Link (15%)
    dom_score = 0.0
    if domain_analysis.get('is_legitimate_domain'):
        dom_score = 5.0
    elif domain_analysis.get('is_redirect_service') or domain_analysis.get('is_suspicious_tld'):
        dom_score = 90.0
        main_reasons.append(f"External link uses suspicious domain/redirect: {domain_analysis.get('domain_evaluated')}")
    elif domain_analysis.get('is_domain_mismatch'):
        dom_score = 65.0
        main_reasons.append(f"External website domain ({domain_analysis.get('domain_evaluated')}) does not match official brand domains.")

    if domain_analysis.get('domain_evaluated'):
        component_scores['domain_mismatch'] = dom_score
        active_weights['domain_mismatch'] = weights['domain_mismatch']
        evidence_records.append({
            'category': 'DOMAIN_MISMATCH',
            'title': f"External domain: {domain_analysis.get('domain_evaluated')}",
            'score_contribution': dom_score,
            'details': "; ".join(domain_analysis.get('reasons', [])),
            'method': 'Domain & TLD Risk Classifier'
        })
    else:
        missing_evidence.append({
            'category': 'DOMAIN_MISMATCH',
            'reason': 'No external website link provided on candidate profile/app.'
        })

    # 6. Contextual Signals (10%)
    ctx_score = 0.0
    ctx_notes = []
    if contextual_signals.get('is_new_account_claiming_official'):
        ctx_score += 40.0
        ctx_notes.append("Recently created profile claiming official status")
    if contextual_signals.get('zero_or_low_followers_with_high_similarity'):
        ctx_score += 30.0
        ctx_notes.append("Low follower count with aggressive brand imitation")
    if contextual_signals.get('is_unverified_claiming_official'):
        ctx_score += 30.0
        ctx_notes.append("Unverified profile using official badges/terms in username")

    ctx_score = min(100.0, ctx_score)
    component_scores['contextual'] = ctx_score
    active_weights['contextual'] = weights['contextual']

    if ctx_notes:
        main_reasons.extend(ctx_notes)
        evidence_records.append({
            'category': 'CONTEXTUAL',
            'title': 'Contextual risk indicators',
            'score_contribution': ctx_score,
            'details': "; ".join(ctx_notes),
            'method': 'Heuristic Signals'
        })

    # DYNAMIC WEIGHT NORMALIZATION
    total_active_weight = sum(active_weights.values())
    if total_active_weight > 0:
        raw_weighted_score = sum(
            component_scores[k] * (active_weights[k] / total_active_weight)
            for k in active_weights
        )
    else:
        raw_weighted_score = 0.0

    final_score = int(round(min(100.0, max(0.0, raw_weighted_score))))

    # Determine Severity Band
    severity = 'LOW'
    severity_desc = ''
    for low, high, label, desc in SEVERITY_BANDS:
        if low <= final_score <= high:
            severity = label
            severity_desc = desc
            break

    # Determine Evidence Quality / Confidence
    available_signals_count = len(component_scores)
    if available_signals_count >= 5:
        confidence = 'HIGH'
    elif available_signals_count >= 3:
        confidence = 'MODERATE'
    else:
        confidence = 'PRELIMINARY'

    # Recommended Action
    if severity == 'CRITICAL':
        recommended_action = "Immediate action: Assign senior analyst to verify candidate. If verified abusive, initiate official platform takedown / DMCA reporting and add domain to threat intelligence blacklist."
    elif severity == 'HIGH':
        recommended_action = "High priority: Review visual evidence and external domain. Confirm if candidate is an authorized distributor or malicious impersonator."
    elif severity == 'MEDIUM':
        recommended_action = "Monitor: Profile presents look-alike characteristics. Check if candidate represents an affiliated partner, local branch, or community fan page before escalating."
    else:
        recommended_action = "Low risk: Routine periodic re-scan. No immediate mitigation required."

    if not main_reasons:
        main_reasons = ["Name similarity detected within monitoring scope."]

    return {
        'overall_score': final_score,
        'severity': severity,
        'severity_description': severity_desc,
        'confidence': confidence,
        'main_reasons': main_reasons,
        'supporting_evidence': evidence_records,
        'missing_evidence': missing_evidence,
        'score_breakdown': {
            'scores': component_scores,
            'weights_applied': {k: round(v / total_active_weight, 3) for k, v in active_weights.items()}
        },
        'recommended_action': recommended_action,
        'human_review_notice': "Note: This is an automated heuristic risk score, not a legal finding of fraud. Every detection must undergo human verification before initiating takedown actions."
    }
