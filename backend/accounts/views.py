import hashlib
import hmac
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.timezone import now
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.emails import EmailService
from api.rate_limiter import check_rate_limit, AuthAttemptRateLimiter
from .models import User
from .serializers import RegisterSerializer

logger = logging.getLogger(__name__)


def generate_password_reset_token(email: str) -> str:
    """Generate a time-based HMAC token for password reset.
    Token is valid for 24 hours (changes every day).
    """
    today = now().strftime("%Y-%m-%d")
    message = f"{email}|{today}".encode()
    token = hmac.new(
        key=settings.SECRET_KEY.encode(),
        msg=message,
        digestmod=hashlib.sha256
    ).hexdigest()
    return token


def verify_password_reset_token(email: str, token: str) -> bool:
    """Verify a password reset token.
    Returns True if token is valid, False if expired or invalid.
    """
    expected_token = generate_password_reset_token(email)
    return hmac.compare_digest(token, expected_token)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        EmailService.send_welcome_email(user.email)
        logger.info(f"New user registered: {user.email}")
        
        response_data = {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        
        # Check rate limiting
        rate_limit_response = check_rate_limit(email)
        if rate_limit_response:
            return rate_limit_response
        
        # Attempt login
        response = super().post(request)
        
        # Handle success and failure
        if response.status_code == status.HTTP_200_OK:
            AuthAttemptRateLimiter.reset_attempts(email)
            logger.info(f"Successful login: {email}")
        else:
            AuthAttemptRateLimiter.record_attempt(email)
            logger.warning(f"Failed login attempt: {email}")
        
        return response


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist to avoid email enumeration
            logger.info(f"Password reset requested for non-existent email: {email}")
            return Response(
                {"detail": "If that email address is in our system, we have sent password reset instructions."},
                status=status.HTTP_200_OK,
            )

        try:
            # Generate time-based token
            token = generate_password_reset_token(email)
            
            # Build reset link
            frontend_url = settings.FRONTEND_URL.rstrip('/')
            reset_link = f"{frontend_url}/reset-password?email={email}&token={token}"
            
            subject = "PricePulse Password Reset"
            html_content = f"""<html><body>
            <p>Hi {user.email},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_link}" style="background-color: #b87355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            </body></html>"""
            text_content = f"Click the link to reset your password: {reset_link}\n\nThis link expires in 24 hours."

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Password reset email sent to {email}")
            return Response(
                {"detail": "If that email address is in our system, we have sent password reset instructions."},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.error(f"Failed to send password reset email to {email}: {exc}")
            return Response(
                {"detail": "Failed to send reset email. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
        token = request.data.get("token", "")
        
        if not email or not password or not token:
            return Response(
                {"detail": "Email, password, and token are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Validate token
        if not verify_password_reset_token(email, token):
            logger.warning(f"Invalid or expired password reset token for {email}")
            return Response(
                {"detail": "Invalid or expired reset token. Please request a new password reset."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Password reset attempted for non-existent user: {email}")
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Validate password
        if len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            user.set_password(password)
            user.save()
            logger.info(f"Password reset successfully for {email}")
            return Response(
                {"detail": "Password reset successful. You can now log in with your new password."},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.error(f"Failed to reset password for {email}: {exc}")
            return Response(
                {"detail": "Failed to reset password. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
