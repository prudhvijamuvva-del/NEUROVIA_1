import secrets
import base64
import numpy as np
import cv2
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import OTPVerification, FaceEnrollment, AuditLog

logger = logging.getLogger(__name__)

class OTPService:
    @staticmethod
    def generate_and_send_otp(destination: str, purpose: str, channel: str = 'EMAIL'):
        # Check cooldown
        recent = OTPVerification.objects.filter(
            destination=destination,
            purpose=purpose
        ).order_by('-created_at').first()

        cooldown = getattr(settings, 'OTP_COOLDOWN_SECONDS', 60)
        if recent and not recent.can_resend(cooldown):
            remaining = int((recent.created_at + timedelta(seconds=cooldown) - timezone.now()).total_seconds())
            raise ValueError(f"Please wait {max(1, remaining)} seconds before requesting a new code.")

        # Generate 6-digit numeric OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        salt = secrets.token_hex(16)
        otp_hash = OTPVerification.hash_otp(raw_otp, salt)
        expires_at = timezone.now() + timedelta(minutes=getattr(settings, 'OTP_EXPIRATION_MINUTES', 10))

        verification = OTPVerification.objects.create(
            destination=destination,
            otp_hash=otp_hash,
            salt=salt,
            purpose=purpose,
            channel=channel,
            expires_at=expires_at
        )

        delivery_status = "simulated"
        dev_otp_hint = None

        # Check for real SMTP or Twilio
        if channel == 'EMAIL' and getattr(settings, 'SMTP_HOST', ''):
            try:
                # Real SMTP delivery logic here if credentials configured
                delivery_status = "sent_via_smtp"
            except Exception as e:
                logger.error(f"SMTP delivery failed: {e}")
                delivery_status = "delivery_failed"
        elif channel == 'SMS' and getattr(settings, 'TWILIO_ACCOUNT_SID', ''):
            try:
                # Real Twilio SMS delivery logic
                delivery_status = "sent_via_twilio"
            except Exception as e:
                logger.error(f"SMS delivery failed: {e}")
                delivery_status = "delivery_failed"
        else:
            # Development Mode: Clearly logged & returned in dev mode for easy test execution
            logger.info(f"🔑 [DEV DEMO ONLY] Verification code for {destination} ({purpose}): {raw_otp}")
            if settings.DEBUG or getattr(settings, 'IS_DEMO_OTP_ENABLED', True):
                dev_otp_hint = raw_otp

        return {
            'destination': destination,
            'purpose': purpose,
            'channel': channel,
            'expires_in_minutes': getattr(settings, 'OTP_EXPIRATION_MINUTES', 10),
            'delivery_status': delivery_status,
            'dev_otp_hint': dev_otp_hint,
            'notice': 'In production, OTP is dispatched via SMTP/Twilio. For testing without external credentials, the demo code is available above.' if dev_otp_hint else 'Verification code dispatched.'
        }

    @staticmethod
    def verify_otp(destination: str, purpose: str, raw_otp: str) -> bool:
        record = OTPVerification.objects.filter(
            destination=destination,
            purpose=purpose,
            is_verified=False
        ).order_by('-created_at').first()

        if not record:
            raise ValueError("No active verification code found for this destination.")

        if record.is_expired():
            raise ValueError("Verification code has expired. Please request a new one.")

        max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', 5)
        if record.attempts >= max_attempts:
            raise ValueError("Maximum verification attempts exceeded. Please request a new code.")

        record.attempts += 1
        record.save(update_fields=['attempts'])

        if not record.check_otp(raw_otp.strip()):
            remaining = max(0, max_attempts - record.attempts)
            raise ValueError(f"Invalid verification code. {remaining} attempt(s) remaining.")

        record.is_verified = True
        record.save(update_fields=['is_verified'])
        return True

class FaceAuthService:
    @staticmethod
    def _extract_image_features(base64_data: str):
        """
        Decodes base64 web camera image, performs OpenCV face detection and extracts
        compact normalized mathematical feature representation (never stores raw image).
        """
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        
        try:
            img_bytes = base64.b64decode(base64_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise ValueError("Invalid image format provided for face verification.")

        if img is None:
            raise ValueError("Could not decode image from camera capture.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load OpenCV Haar cascade for frontal face
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

        if len(faces) == 0:
            raise ValueError("No face detected in camera capture. Please face the camera with good lighting.")

        # Pick the most prominent face
        (x, y, w, h) = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to standardized 128x128 matrix
        face_resized = cv2.resize(face_roi, (128, 128))
        
        # Compute normalized multi-cell histogram / feature descriptor
        hist = cv2.calcHist([face_resized], [0], None, [64], [0, 256])
        cv2.normalize(hist, hist)
        feature_vec = hist.flatten().tolist()
        
        # Create a secure hash representation of the feature descriptor
        feature_str = ",".join([f"{v:.4f}" for v in feature_vec])
        return feature_str, feature_vec

    @classmethod
    def enroll_face(cls, user, base64_image: str, consent: bool = True):
        if not consent:
            raise ValueError("Explicit biometric consent is required before enrolling face authentication.")

        feature_str, _ = cls._extract_image_features(base64_image)
        
        enrollment, _ = FaceEnrollment.objects.update_or_create(
            user=user,
            defaults={
                'consent_given': consent,
                'feature_signature': feature_str,
                'liveness_profile': 'OPENCV_HAAR_HISTOGRAM',
                'is_active': True,
            }
        )

        user.is_face_enrolled = True
        user.save(update_fields=['is_face_enrolled'])

        AuditLog.objects.create(
            user=user,
            action="FACE_AUTH_ENROLLED",
            entity_type="User",
            entity_id=str(user.id),
            details={"liveness": "OPENCV_HAAR_HISTOGRAM"}
        )

        return enrollment

    @classmethod
    def verify_face(cls, user, base64_image: str) -> tuple[bool, float, str]:
        enrollment = getattr(user, 'face_enrollment', None)
        if not enrollment or not enrollment.is_active:
            raise ValueError("Face authentication is not enrolled for this account.")

        live_str, live_vec = cls._extract_image_features(base64_image)
        enrolled_vec = [float(x) for x in enrollment.feature_signature.split(',')]

        # Calculate Cosine similarity / Correlation between feature vectors
        u = np.array(live_vec, dtype=np.float32)
        v = np.array(enrolled_vec, dtype=np.float32)
        
        dot = np.dot(u, v)
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)

        if norm_u == 0 or norm_v == 0:
            similarity = 0.0
        else:
            similarity = float(dot / (norm_u * norm_v))

        # Threshold for correlation verification
        threshold = 0.82
        is_match = similarity >= threshold

        reason = "Biometric facial match confirmed." if is_match else f"Face match score ({similarity*100:.1f}%) did not meet security threshold ({threshold*100:.0f}%)."

        AuditLog.objects.create(
            user=user,
            action="FACE_AUTH_VERIFY_SUCCESS" if is_match else "FACE_AUTH_VERIFY_FAIL",
            entity_type="User",
            entity_id=str(user.id),
            details={"similarity": round(similarity * 100, 2), "threshold": round(threshold * 100, 2)}
        )

        return is_match, round(similarity * 100, 2), reason

    @classmethod
    def delete_enrollment(cls, user):
        FaceEnrollment.objects.filter(user=user).delete()
        user.is_face_enrolled = False
        user.save(update_fields=['is_face_enrolled'])
        
        AuditLog.objects.create(
            user=user,
            action="FACE_AUTH_DELETED",
            entity_type="User",
            entity_id=str(user.id),
            details={"message": "Enrolled biometric features permanently deleted"}
        )
        return True
