from django.urls import path
from .views import (
    RegisterView,
    VerifyOTPView,
    ResendOTPView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    FaceEnrollView,
    FaceVerifyView,
    FaceDeleteView,
    MeView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('face/enroll/', FaceEnrollView.as_view(), name='auth-face-enroll'),
    path('face/verify/', FaceVerifyView.as_view(), name='auth-face-verify'),
    path('face/enrollment/', FaceDeleteView.as_view(), name='auth-face-delete'),
    path('me/', MeView.as_view(), name='auth-me'),
]
