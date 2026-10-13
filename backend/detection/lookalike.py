import re
import unicodedata
from rapidfuzz import fuzz, distance

# Common confusable characters (homoglyphs, cyrillic/greek substitutes, leetspeak)
CONFUSABLE_MAP = {
    'а': 'a', 'а': 'a', 'ä': 'a', 'á': 'a', 'à': 'a', 'â': 'a', '@': 'a', '4': 'a',
    'в': 'b', '8': 'b',
    'с': 'c', 'ç': 'c', 'ć': 'c', 'č': 'c',
    'е': 'e', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', '3': 'e',
    'і': 'i', 'í': 'i', 'ì': 'i', 'ï': 'i', '1': 'i', '!': 'i', '|': 'i',
    'к': 'k',
    'м': 'm',
    'н': 'h',
    'о': 'o', 'ö': 'o', 'ó': 'o', 'ò': 'o', 'ô': 'o', '0': 'o', 'ø': 'o',
    'р': 'p',
    'ѕ': 's', '$': 's', '5': 's', 'ş': 's', 'š': 's',
    'т': 't', '7': 't',
    'у': 'y', 'ý': 'y',
    'х': 'x',
    '0': 'o', '1': 'l'
}

SUSPICIOUS_AFFIXES = [
    'support', 'official', 'help', 'customercare', 'customer care', 'care',
    'service', 'login', 'security', 'verify', 'verification', 'desk',
    'team', 'online', 'portal', 'auth', 'direct', 'refund', 'rewards',
    'promo', 'bot', 'agent', 'contact', 'assist', 'global'
]

def normalize_text(text: str) -> str:
    if not text:
        return ""
    # Unicode NFKD normalization
    normalized = unicodedata.normalize('NFKD', text.strip().lower())
    # Strip accents / non-spacing marks
    normalized = "".join([c for c in normalized if not unicodedata.combining(c)])
    return normalized

def substitute_confusables(text: str) -> tuple[str, list[dict]]:
    confusables_found = []
    chars = []
    for idx, ch in enumerate(text.lower()):
        if ch in CONFUSABLE_MAP:
            replacement = CONFUSABLE_MAP[ch]
            confusables_found.append({
                'char': ch,
                'replaced_by': replacement,
                'index': idx
            })
            chars.append(replacement)
        else:
            chars.append(ch)
    return "".join(chars), confusables_found

def clean_alphanumeric(text: str) -> str:
    return re.sub(r'[^a-z0-9]', '', text.lower())

def analyze_lookalike_name(
    candidate_name: str,
    brand_name: str,
    aliases: list[str] = None,
    threshold: float = 65.0
) -> dict:
    """
    Smart look-alike name detection module.
    Evaluates token similarity, Damerau-Levenshtein distance, confusable characters,
    character transpositions, and suspicious affixes.
    """
    if aliases is None:
        aliases = []

    all_brand_targets = [brand_name] + aliases
    best_match = {
        'original_name': candidate_name,
        'normalized_name': normalize_text(candidate_name),
        'target_brand': brand_name,
        'similarity_score': 0.0,
        'matching_method': 'none',
        'match_explanation': 'No significant similarity detected.',
        'is_exact': False,
        'has_suspicious_affix': False,
        'matched_affixes': [],
        'transposition_detected': False,
        'confusables_found': [],
        'meets_threshold': False
    }

    cand_norm = normalize_text(candidate_name)
    cand_sub, cand_confusables = substitute_confusables(cand_norm)
    cand_alphanumeric = clean_alphanumeric(cand_sub)

    for target in all_brand_targets:
        target_norm = normalize_text(target)
        target_alphanumeric = clean_alphanumeric(target_norm)

        # 1. Exact match check
        if cand_alphanumeric == target_alphanumeric:
            return {
                'original_name': candidate_name,
                'normalized_name': cand_norm,
                'target_brand': target,
                'similarity_score': 100.0,
                'matching_method': 'exact_normalized',
                'match_explanation': f"Exact match with protected brand '{target}' after normalization.",
                'is_exact': True,
                'has_suspicious_affix': False,
                'matched_affixes': [],
                'transposition_detected': False,
                'confusables_found': cand_confusables,
                'meets_threshold': True
            }

        # 2. Suspicious affix check (e.g., AcmePay Support, AcmePay Official Help)
        matched_affixes = []
        cand_lower = candidate_name.lower()
        for affix in SUSPICIOUS_AFFIXES:
            if affix in cand_lower:
                matched_affixes.append(affix)

        # If brand name is contained within candidate name
        is_substring = target_alphanumeric in cand_alphanumeric
        
        # 3. Fuzzy metrics using RapidFuzz
        token_set_sim = fuzz.token_set_ratio(cand_sub, target_norm)
        token_sort_sim = fuzz.token_sort_ratio(cand_sub, target_norm)
        partial_sim = fuzz.partial_ratio(cand_sub, target_norm)
        
        # Damerau-Levenshtein distance (detects character swaps/transpositions)
        d_dist = distance.DamerauLevenshtein.distance(cand_alphanumeric, target_alphanumeric)
        max_len = max(len(cand_alphanumeric), len(target_alphanumeric), 1)
        dl_similarity = max(0.0, (1.0 - (d_dist / max_len)) * 100.0)

        # Check for character transposition (distance 1 with same length and character multiset)
        transposition = False
        if len(cand_alphanumeric) == len(target_alphanumeric) and d_dist == 1:
            if sorted(cand_alphanumeric) == sorted(target_alphanumeric):
                transposition = True

        # Synthesize composite name score
        if is_substring and matched_affixes:
            # High intent to deceive
            score = max(88.0, token_set_sim)
            method = 'brand_with_suspicious_affixes'
            explanation = f"Brand name combined with sensitive customer-facing keyword(s): {', '.join(matched_affixes)}."
        elif transposition:
            score = 92.0
            method = 'character_transposition'
            explanation = f"High-confidence typographical transposition (character swap) imitating '{target}'."
        elif cand_confusables and dl_similarity > 80:
            score = max(dl_similarity, 85.0)
            method = 'unicode_confusable_homoglyph'
            conf_str = ", ".join([f"'{c['char']}'→'{c['replaced_by']}'" for c in cand_confusables[:3]])
            explanation = f"Potential visual look-alike using look-alike / homoglyph characters: {conf_str}."
        elif dl_similarity >= 85:
            score = dl_similarity
            method = 'damerau_levenshtein_typo'
            explanation = f"Close edit distance ({d_dist} character difference) indicating typo-squatting or look-alike variation."
        elif token_set_sim >= 75:
            score = (token_set_sim * 0.7) + (token_sort_sim * 0.3)
            method = 'token_fuzzy_similarity'
            explanation = f"Significant token overlap with brand identity '{target}'."
        else:
            score = max(token_sort_sim, dl_similarity * 0.8)
            method = 'low_similarity'
            explanation = f"Low or tangential similarity to '{target}'."

        score = round(min(100.0, max(0.0, float(score))), 1)

        if score > best_match['similarity_score']:
            best_match = {
                'original_name': candidate_name,
                'normalized_name': cand_norm,
                'target_brand': target,
                'similarity_score': score,
                'matching_method': method,
                'match_explanation': explanation,
                'is_exact': False,
                'has_suspicious_affix': bool(matched_affixes),
                'matched_affixes': matched_affixes,
                'transposition_detected': transposition,
                'confusables_found': cand_confusables,
                'meets_threshold': score >= threshold
            }

    return best_match
