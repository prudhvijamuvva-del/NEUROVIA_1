from django.test import TestCase
from .lookalike import analyze_lookalike_name
from .text_matcher import analyze_text_similarity
from .scoring_engine import calculate_risk_score
from brands.models import Brand, OfficialBrandAsset
from accounts.models import Organization
from monitoring.models import SocialProfileCandidate
from monitoring.pipeline import process_social_candidate

class DetectionEngineTestCase(TestCase):
    def setUp(self):
        self.brand_name = "AcmePay"
        self.aliases = ["Acme Pay", "AcmePay Wallet"]

    def test_exact_name_match(self):
        """Exact normalized match returns 100% similarity."""
        res = analyze_lookalike_name("acmepay", self.brand_name)
        self.assertEqual(res['similarity_score'], 100.0)
        self.assertTrue(res['is_exact'])

    def test_character_transposition_swap(self):
        """Character swap (e.g. AcmePya) is detected via Damerau-Levenshtein."""
        res = analyze_lookalike_name("AcmePya", self.brand_name)
        self.assertGreaterEqual(res['similarity_score'], 90.0)
        self.assertTrue(res['transposition_detected'])

    def test_suspicious_affixes(self):
        """Added words like 'support', 'help', 'official' are flagged."""
        res = analyze_lookalike_name("AcmePay Official Help", self.brand_name)
        self.assertGreaterEqual(res['similarity_score'], 80.0)
        self.assertTrue(res['has_suspicious_affix'])
        self.assertIn('support' in res['matched_affixes'] or 'help' in res['matched_affixes'] or 'official' in res['matched_affixes'], [True])

    def test_unicode_confusable_homoglyphs(self):
        """Cyrillic homoglyph substitution is normalized and detected."""
        # Using Cyrillic 'а', 'е', 'о'
        homoglyph_candidate = "АсmеРау"
        res = analyze_lookalike_name(homoglyph_candidate, self.brand_name)
        self.assertGreaterEqual(res['similarity_score'], 85.0)

    def test_spacing_and_punctuation(self):
        """Variations like 'Acme-Pay' and 'Acme Pay' match effectively."""
        res1 = analyze_lookalike_name("Acme-Pay", self.brand_name)
        res2 = analyze_lookalike_name("Acme Pay", self.brand_name)
        self.assertGreaterEqual(res1['similarity_score'], 85.0)
        self.assertGreaterEqual(res2['similarity_score'], 85.0)

    def test_unrelated_name_low_score(self):
        """Completely unrelated names receive low scores below threshold."""
        res = analyze_lookalike_name("Apex Construction Supplies", self.brand_name)
        self.assertLess(res['similarity_score'], 50.0)
        self.assertFalse(res['meets_threshold'])

    def test_risk_scoring_engine_normalization(self):
        """Verify dynamic weight normalization when evidence components are missing."""
        name_analysis = {'similarity_score': 85.0, 'meets_threshold': True, 'match_explanation': 'High name similarity'}
        logo_analysis = {'is_available': False, 'similarity_score': None}
        text_analysis = {'is_available': True, 'similarity_score': 70.0, 'explanation': 'Claims support role'}
        domain_analysis = {'is_domain_mismatch': True, 'domain_evaluated': 'phish.xyz', 'reasons': ['Domain mismatch']}

        result = calculate_risk_score(name_analysis, logo_analysis, text_analysis, domain_analysis)
        self.assertGreaterEqual(result['overall_score'], 50)
        self.assertIn(result['severity'], ['HIGH', 'CRITICAL'])
        self.assertIsNotNone(result['human_review_notice'])
        self.assertTrue(len(result['missing_evidence']) > 0)

    def test_official_brand_asset_exclusion(self):
        """Official verified brand assets must NEVER trigger suspicious threat detections."""
        org = Organization.objects.create(name="Acme Corp", slug="acme-corp")
        brand = Brand.objects.create(
            organization=org,
            name="AcmePay",
            website_url="https://acmepay.com"
        )
        # Add official verified account
        OfficialBrandAsset.objects.create(
            brand=brand,
            asset_type=OfficialBrandAsset.AssetType.SOCIAL_ACCOUNT,
            platform=OfficialBrandAsset.Platform.TWITTER_X,
            identifier="acmepay",
            official_url="https://x.com/acmepay",
            is_verified=True
        )

        candidate = SocialProfileCandidate.objects.create(
            brand=brand,
            platform="X (Twitter)",
            username="acmepay",
            display_name="AcmePay Official",
            profile_url="https://x.com/acmepay"
        )

        detection = process_social_candidate(candidate, brand)
        self.assertIsNone(detection, "Official verified account must not generate a suspicious alert")
        candidate.refresh_from_db()
        self.assertTrue(candidate.is_official_asset)
