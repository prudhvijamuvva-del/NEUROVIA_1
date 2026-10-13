import uuid
from django.utils.text import slugify
from django.contrib.auth import authenticate
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Organization, OrganizationMembership, AuditLog, Notification
from .services import OTPService, FaceAuthService
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    FaceEnrollSerializer,
    FaceVerifySerializer,
    MembershipSerializer
)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email'].lower()
        
        # Create unactivated user
        user = User.objects.create_user(
            email=email,
            password=data['password'],
            full_name=data['full_name'],
            mobile=data.get('mobile', ''),
            terms_consented=data['terms_consent'],
            is_active=False
        )

        # Store organization name in temporary user note or create org
        org_name = data.get('organization_name') or f"{data['full_name']}'s Org"
        org = Organization.objects.create(
            name=org_name,
            slug=slugify(org_name) + '-' + str(uuid.uuid4())[:6]
        )
        OrganizationMembership.objects.create(
            user=user,
            organization=org,
            role=OrganizationMembership.Role.ADMIN
        )

        channel = data.get('verification_channel', 'EMAIL')
        destination = email if channel == 'EMAIL' else data.get('mobile', email)

        try:
            otp_data = OTPService.generate_and_send_otp(
                destination=destination,
                purpose='REGISTRATION',
                channel=channel
            )
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': f"Account created. A verification code has been dispatched to your {channel.lower()}.",
            'otp_details': otp_data
        }, status=status.HTTP_201_CREATED)

class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        destination = data['destination'].lower()
        raw_otp = data['otp']
        purpose = data['purpose']

        try:
            OTPService.verify_otp(destination, purpose, raw_otp)
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # If registration, activate user
        user = User.objects.filter(email=destination).first() or User.objects.filter(mobile=destination).first()
        if user and purpose == 'REGISTRATION':
            user.is_active = True
            user.is_email_verified = True
            user.save(update_fields=['is_active', 'is_email_verified'])

            tokens = get_tokens_for_user(user)
            membership = user.memberships.select_related('organization').first()
            
            AuditLog.objects.create(
                user=user,
                organization=membership.organization if membership else None,
                action="USER_VERIFIED_AND_ACTIVATED",
                entity_type="User",
                entity_id=str(user.id)
            )

            return Response({
                'success': True,
                'message': "Account verified successfully.",
                'tokens': tokens,
                'user': UserSerializer(user).data,
                'organization': {
                    'id': str(membership.organization.id) if membership else None,
                    'name': membership.organization.name if membership else None,
                    'role': membership.role if membership else 'ADMIN'
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': True,
            'message': "Verification code verified successfully."
        }, status=status.HTTP_200_OK)

class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        destination = request.data.get('destination', '').lower()
        purpose = request.data.get('purpose', 'REGISTRATION')
        channel = request.data.get('channel', 'EMAIL')

        if not destination:
            return Response({'success': False, 'detail': 'Destination is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_data = OTPService.generate_and_send_otp(destination, purpose, channel)
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': "New verification code has been dispatched.",
            'otp_details': otp_data
        })

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['email_or_mobile'].strip().lower()
        password = serializer.validated_data['password']

        user = User.objects.filter(email=identifier).first() or User.objects.filter(mobile=identifier).first()
        if not user or not user.check_password(password):
            return Response({'success': False, 'detail': "Invalid email/mobile or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'success': False,
                'detail': "Account requires OTP verification before logging in.",
                'requires_verification': True,
                'destination': user.email
            }, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        membership = user.memberships.select_related('organization').filter(is_active=True).first()

        AuditLog.objects.create(
            user=user,
            organization=membership.organization if membership else None,
            action="USER_LOGIN",
            entity_type="User",
            entity_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'success': True,
            'message': "Authentication successful.",
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'organization': {
                'id': str(membership.organization.id) if membership else None,
                'name': membership.organization.name if membership else None,
                'role': membership.role if membership else 'ANALYST'
            }
        })

class ForgotPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        destination = serializer.validated_data['destination'].strip().lower()
        channel = serializer.validated_data['channel']
        user = User.objects.filter(email=destination).first() or User.objects.filter(mobile=destination).first()

        otp_info = None
        if user:
            try:
                otp_info = OTPService.generate_and_send_otp(destination, 'PASSWORD_RESET', channel)
            except Exception as e:
                return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Generic response to prevent enumeration
        resp_data = {
            'success': True,
            'message': "If a matching account exists, a password reset code has been sent."
        }
        if otp_info:
            resp_data['otp_details'] = otp_info
        return Response(resp_data, status=status.HTTP_200_OK)

class ResetPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        destination = serializer.validated_data['destination'].strip().lower()
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            OTPService.verify_otp(destination, 'PASSWORD_RESET', otp)
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=destination).first() or User.objects.filter(mobile=destination).first()
        if not user:
            return Response({'success': False, 'detail': "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        AuditLog.objects.create(
            user=user,
            action="PASSWORD_RESET_SUCCESS",
            entity_type="User",
            entity_id=str(user.id)
        )

        return Response({
            'success': True,
            'message': "Your password has been successfully reset. You may now log in."
        })

class FaceEnrollView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FaceEnrollSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            FaceAuthService.enroll_face(
                user=request.user,
                base64_image=serializer.validated_data['image_base64'],
                consent=serializer.validated_data.get('consent', True)
            )
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': "Face biometric authentication successfully enrolled. Biometric templates securely encrypted."
        })

class FaceVerifyView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = FaceVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        if not email and request.user.is_authenticated:
            user = request.user
        elif email:
            user = User.objects.filter(email=email.strip().lower()).first()
        else:
            return Response({'success': False, 'detail': "Email identifier required for face verification."}, status=status.HTTP_400_BAD_REQUEST)

        if not user:
            return Response({'success': False, 'detail': "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            is_match, score, reason = FaceAuthService.verify_face(user, serializer.validated_data['image_base64'])
        except Exception as e:
            return Response({'success': False, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not is_match:
            return Response({
                'success': False,
                'detail': reason,
                'similarity_score': score
            }, status=status.HTTP_401_UNAUTHORIZED)

        tokens = get_tokens_for_user(user)
        membership = user.memberships.select_related('organization').filter(is_active=True).first()

        return Response({
            'success': True,
            'message': "Face biometric authentication successful.",
            'similarity_score': score,
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'organization': {
                'id': str(membership.organization.id) if membership else None,
                'name': membership.organization.name if membership else None,
                'role': membership.role if membership else 'ANALYST'
            }
        })

class FaceDeleteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        FaceAuthService.delete_enrollment(request.user)
        return Response({
            'success': True,
            'message': "Enrolled face biometric profile and descriptors have been permanently deleted."
        })

class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        membership = user.memberships.select_related('organization').filter(is_active=True).first()
        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'organization': {
                'id': str(membership.organization.id) if membership else None,
                'name': membership.organization.name if membership else None,
                'role': membership.role if membership else 'VIEWER'
            } if membership else None
        })
