import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = ['.xyz', '.top', '.club', '.online', '.site', '.work', '.click', '.live', '.cc', '.info', '.biz', '.tk', '.ga']
FREE_REDIRECT_HOSTS = ['linktr.ee', 'bit.ly', 'tinyurl.com', 'rb.gy', 'cutt.ly', 'is.gd', 't.co', 'wa.me', 't.me']

def extract_domain(url: str) -> str:
    if not url:
        return ""
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        if host.startswith('www.'):
            host = host[4:]
        return host
    except Exception:
        return ""

def analyze_domain_and_publisher(
    external_url: str = None,
    candidate_publisher: str = None,
    candidate_package_id: str = None,
    brand_name: str = "",
    legitimate_domains: list[str] = None,
    official_publishers: list[str] = None
) -> dict:
    if legitimate_domains is None:
        legitimate_domains = []
    if official_publishers is None:
        official_publishers = []

    legit_norm_domains = [extract_domain(d) for d in legitimate_domains if d]
    legit_norm_publishers = [p.lower().strip() for p in official_publishers if p]

    result = {
        'external_url': external_url,
        'domain_evaluated': None,
        'is_legitimate_domain': False,
        'is_domain_mismatch': False,
        'is_suspicious_tld': False,
        'is_redirect_service': False,
        'publisher_evaluated': candidate_publisher,
        'is_publisher_matched': False,
        'is_publisher_mismatch': False,
        'risk_score': 0.0,
        'reasons': [],
        'is_available': False
    }

    evidence_available = False

    # 1. External URL Analysis
    if external_url and external_url.strip():
        evidence_available = True
        cand_domain = extract_domain(external_url)
        result['domain_evaluated'] = cand_domain

        # Check if matches legitimate domains
        is_legit = any(cand_domain == ld or cand_domain.endswith('.' + ld) for ld in legit_norm_domains)
        if is_legit:
            result['is_legitimate_domain'] = True
            result['reasons'].append(f"External link points to registered legitimate domain '{cand_domain}'.")
            result['risk_score'] = max(0.0, result['risk_score'] - 40.0)
        else:
            result['is_domain_mismatch'] = True
            result['risk_score'] += 35.0
            result['reasons'].append(f"External domain '{cand_domain}' does not match any registered official brand domains.")

            # Check for URL redirect / link shortener
            if any(cand_domain == r or cand_domain.endswith('.' + r) for r in FREE_REDIRECT_HOSTS):
                result['is_redirect_service'] = True
                result['risk_score'] += 25.0
                result['reasons'].append(f"Uses generic redirect or messaging link ({cand_domain}), commonly used in phishing campaigns.")

            # Check for suspicious TLD
            if any(cand_domain.endswith(tld) for tld in SUSPICIOUS_TLDS):
                result['is_suspicious_tld'] = True
                result['risk_score'] += 20.0
                result['reasons'].append(f"Uses high-risk low-cost top-level domain ({cand_domain}).")

    # 2. Publisher Analysis (For Apps)
    if candidate_publisher and candidate_publisher.strip():
        evidence_available = True
        cand_pub_lower = candidate_publisher.lower().strip()
        brand_lower = brand_name.lower().strip()

        is_pub_legit = any(cand_pub_lower == op for op in legit_norm_publishers) or (cand_pub_lower == brand_lower)
        if is_pub_legit:
            result['is_publisher_matched'] = True
            result['reasons'].append(f"Developer/Publisher '{candidate_publisher}' matches official brand identity.")
            result['risk_score'] = max(0.0, result['risk_score'] - 30.0)
        else:
            result['is_publisher_mismatch'] = True
            result['risk_score'] += 30.0
            result['reasons'].append(f"Publisher '{candidate_publisher}' does not match official registered developer name.")

    # 3. Package ID Analysis (For Apps)
    if candidate_package_id and candidate_package_id.strip():
        evidence_available = True
        pkg_lower = candidate_package_id.lower()
        if brand_lower and brand_lower not in pkg_lower and ('support' in pkg_lower or 'help' in pkg_lower or 'app' in pkg_lower):
            result['risk_score'] += 15.0
            result['reasons'].append(f"Package ID '{candidate_package_id}' does not follow brand namespace.")

    result['is_available'] = evidence_available
    result['risk_score'] = min(100.0, max(0.0, result['risk_score']))
    return result
