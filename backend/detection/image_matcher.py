import io
import os
import requests
import imagehash
from PIL import Image
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)

def load_image(image_input):
    """Loads a PIL image from a file path, file-like object, or URL."""
    if not image_input:
        return None
    try:
        if isinstance(image_input, str):
            if image_input.startswith(('http://', 'https://')):
                resp = requests.get(image_input, timeout=5)
                if resp.status_code == 200:
                    return Image.open(io.BytesIO(resp.content)).convert('RGB')
                return None
            elif os.path.exists(image_input):
                return Image.open(image_input).convert('RGB')
        elif hasattr(image_input, 'read'):
            return Image.open(image_input).convert('RGB')
    except Exception as e:
        logger.warning(f"Error loading image for comparison: {e}")
    return None

def compare_logos(candidate_image_input, brand_logo_input, brand_logo_hash: str = None) -> dict:
    """
    Compares candidate profile/app icon with official brand logo using
    Perceptual Hashing (dHash/pHash) and OpenCV 2D color histogram correlation.
    """
    cand_img = load_image(candidate_image_input)
    if cand_img is None:
        return {
            'is_available': False,
            'similarity_score': None,
            'method': 'none',
            'explanation': 'Candidate profile image or app icon is not available for visual comparison.',
            'confidence': 'low'
        }

    # 1. Perceptual Hash comparison
    cand_dhash = imagehash.dhash(cand_img)
    cand_phash = imagehash.phash(cand_img)

    brand_img = load_image(brand_logo_input)
    
    if brand_img is not None:
        brand_dhash = imagehash.dhash(brand_img)
        brand_phash = imagehash.phash(brand_img)
    elif brand_logo_hash:
        try:
            brand_dhash = imagehash.hex_to_hash(brand_logo_hash)
            brand_phash = brand_dhash
        except Exception:
            brand_dhash = None
    else:
        brand_dhash = None

    if brand_dhash is None:
        return {
            'is_available': False,
            'similarity_score': None,
            'method': 'none',
            'explanation': 'Official brand logo has not been registered or pre-computed.',
            'confidence': 'low'
        }

    # Hamming distance: 0 is identical, 64 is maximum distance
    diff_d = cand_dhash - brand_dhash
    diff_p = cand_phash - brand_phash if brand_img else diff_d
    avg_diff = (diff_d * 0.6) + (diff_p * 0.4)

    # Convert difference to percentage (diff 0 -> 100%, diff 20+ -> low)
    hash_sim = max(0.0, (1.0 - (avg_diff / 24.0)) * 100.0)

    # 2. OpenCV Histogram Correlation if both images are loaded in memory
    hist_sim = None
    if brand_img is not None:
        try:
            cv_cand = cv2.cvtColor(np.array(cand_img), cv2.COLOR_RGB2BGR)
            cv_brand = cv2.cvtColor(np.array(brand_img), cv2.COLOR_RGB2BGR)

            cv_cand = cv2.resize(cv_cand, (128, 128))
            cv_brand = cv2.resize(cv_brand, (128, 128))

            hist_cand = cv2.calcHist([cv_cand], [0, 1], None, [32, 32], [0, 256, 0, 256])
            hist_brand = cv2.calcHist([cv_brand], [0, 1], None, [32, 32], [0, 256, 0, 256])

            cv2.normalize(hist_cand, hist_cand, 0, 1, cv2.NORM_MINMAX)
            cv2.normalize(hist_brand, hist_brand, 0, 1, cv2.NORM_MINMAX)

            corr = cv2.compareHist(hist_cand, hist_brand, cv2.HISTCMP_CORREL)
            hist_sim = max(0.0, float(corr) * 100.0)
        except Exception as e:
            logger.warning(f"OpenCV histogram comparison failed: {e}")

    # Combine metrics
    if hist_sim is not None:
        combined_score = (hash_sim * 0.7) + (hist_sim * 0.3)
    else:
        combined_score = hash_sim

    final_score = round(min(100.0, max(0.0, float(combined_score))), 1)

    if final_score >= 85:
        explanation = f"High perceptual image similarity ({final_score}%). The candidate icon appears visually identical or heavily copied from the official brand logo."
    elif final_score >= 60:
        explanation = f"Moderate visual resemblance ({final_score}%). Similar layout, color palette, or stylized typography detected."
    else:
        explanation = f"Low visual similarity ({final_score}%). The icon appears distinct from the official brand logo."

    return {
        'is_available': True,
        'similarity_score': final_score,
        'hash_difference': int(avg_diff),
        'method': 'perceptual_hash_and_opencv_hist',
        'explanation': explanation,
        'confidence': 'high' if brand_img else 'moderate'
    }
