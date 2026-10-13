import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

AFFILIATION_PATTERNS = [
    r'official\s+(?:page|account|channel|support|handle|profile|app)',
    r'customer\s+(?:support|care|service|helpdesk)',
    r'authorized\s+(?:dealer|partner|representative|agent|reseller)',
    r'24/7\s+(?:help|support|assistance|service)',
    r'we\s+are\s+the\s+official',
    r'headquarters\s+of',
    r'verify\s+your\s+account',
    r'instant\s+(?:refund|loan|rewards|cashback)'
]

def analyze_text_similarity(
    candidate_text: str,
    brand_description: str,
    brand_keywords: list[str] = None
) -> dict:
    """
    Computes TF-IDF Cosine Similarity and analyzes impersonation patterns
    in candidate biography or application description.
    """
    if brand_keywords is None:
        brand_keywords = []

    if not candidate_text or not candidate_text.strip():
        return {
            'is_available': False,
            'similarity_score': None,
            'claimed_affiliation': False,
            'matched_affiliation_phrases': [],
            'matched_keywords': [],
            'explanation': 'No bio or description provided by candidate.'
        }

    cand_clean = candidate_text.lower()
    
    # Check affiliation claim phrases
    matched_phrases = []
    for pattern in AFFILIATION_PATTERNS:
        matches = re.findall(pattern, cand_clean)
        if matches:
            matched_phrases.extend(matches)

    # Check brand keyword mentions
    matched_keywords = []
    for kw in brand_keywords:
        if kw and kw.lower() in cand_clean:
            matched_keywords.append(kw)

    # TF-IDF Cosine Similarity if brand description exists
    reference_corpus = [brand_description.lower()] if brand_description else []
    if brand_keywords:
        reference_corpus.append(" ".join([k.lower() for k in brand_keywords]))

    ref_text = " ".join(reference_corpus)

    if ref_text.strip():
        try:
            vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
            tfidf_matrix = vectorizer.fit_transform([cand_clean, ref_text])
            cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            cos_score = round(float(cos_sim) * 100.0, 1)
        except Exception:
            cos_score = 0.0
    else:
        cos_score = 0.0

    # Adjust score if claiming official status or targeting brand keywords
    adjusted_score = cos_score
    if matched_phrases and (matched_keywords or cos_score > 20):
        adjusted_score = max(adjusted_score, 75.0)
    elif matched_phrases:
        adjusted_score = max(adjusted_score, 50.0)
    elif matched_keywords:
        adjusted_score = max(adjusted_score, 40.0)

    adjusted_score = min(100.0, max(0.0, adjusted_score))

    explanation_parts = []
    if matched_phrases:
        explanation_parts.append(f"Uses authoritative claim phrases: {', '.join(set(matched_phrases))}")
    if matched_keywords:
        explanation_parts.append(f"Repeatedly mentions brand assets/keywords: {', '.join(set(matched_keywords))}")
    if cos_score > 30:
        explanation_parts.append(f"Textual semantics closely mirror official description ({cos_score}% cosine similarity)")

    explanation = "; ".join(explanation_parts) if explanation_parts else "Low description similarity."

    return {
        'is_available': True,
        'similarity_score': adjusted_score,
        'raw_cosine_score': cos_score,
        'claimed_affiliation': bool(matched_phrases),
        'matched_affiliation_phrases': list(set(matched_phrases)),
        'matched_keywords': list(set(matched_keywords)),
        'explanation': explanation
    }
