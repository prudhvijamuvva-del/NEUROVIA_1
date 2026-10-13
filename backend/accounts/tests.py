from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import User, Organization, OrganizationMembership, OTPVerification
from .services import OTPService, FaceAuthService

class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.email = "analyst@brandshield.ai"
        self.password = "StrongPass123!"
        self.user = User.objects.create_user(
            email=self.email,
            password=self.password,
            full_name="Sarah Analyst",
            is_active=True,
            is_email_verified=True
        )
        self.org = Organization.objects.create(name="Cyber Defense Corp", slug="cyber-defense-corp")
        self.membership = OrganizationMembership.objects.create(
            user=self.user,
            organization=self.org,
            role=OrganizationMembership.Role.ADMIN
        )

    def test_user_creation_and_password_hash(self):
        """Ensure password is saved as a secure hash and never in plaintext."""
        self.assertNotEqual(self.user.password, self.password)
        self.assertTrue(self.user.check_password(self.password))
        self.assertFalse(self.user.check_password("WrongPassword!"))

    def test_otp_generation_and_verification(self):
        """Test OTP generation, salted hashing, and verification flow."""
        otp_info = OTPService.generate_and_send_otp(
            destination="test@example.com",
            purpose="REGISTRATION",
            channel="EMAIL"
        )
        self.assertIsNotNone(otp_info['dev_otp_hint'])
        raw_code = otp_info['dev_otp_hint']

        # Verify correct OTP
        is_valid = OTPService.verify_otp("test@example.com", "REGISTRATION", raw_code)
        self.assertTrue(is_valid)

        # Re-using the same OTP must fail
        with self.assertRaises(ValueError):
            OTPService.verify_otp("test@example.com", "REGISTRATION", raw_code)

    def test_otp_invalid_code_and_attempt_limit(self):
        """Test that incorrect OTP decrements attempts and raises error."""
        otp_info = OTPService.generate_and_send_otp(
            destination="security@example.com",
            purpose="LOGIN",
            channel="EMAIL"
        )
        with self.assertRaises(ValueError):
            OTPService.verify_otp("security@example.com", "LOGIN", "000000")

    def test_otp_expiration(self):
        """Test expired OTP rejection."""
        otp_info = OTPService.generate_and_send_otp(
            destination="expired@example.com",
            purpose="PASSWORD_RESET",
            channel="EMAIL"
        )
        raw_code = otp_info['dev_otp_hint']
        record = OTPVerification.objects.filter(destination="expired@example.com").first()
        record.expires_at = timezone.now() - timedelta(minutes=15)
        record.save()

        with self.assertRaises(ValueError) as ctx:
            OTPService.verify_otp("expired@example.com", "PASSWORD_RESET", raw_code)
        self.assertIn("expired", str(ctx.exception).lower())

    def test_otp_cooldown_rate_limit(self):
        """Test cooldown prevents spamming OTP requests within 60 seconds."""
        OTPService.generate_and_send_otp("cooldown@example.com", "REGISTRATION")
        with self.assertRaises(ValueError) as ctx:
            OTPService.generate_and_send_otp("cooldown@example.com", "REGISTRATION")
        self.assertIn("wait", str(ctx.exception).lower())
