import logging
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.emails import EmailService
from api.rate_limiter import check_rate_limit, AuthAttemptRateLimiter
from .serializers import RegisterSerializer

logger = logging.getLogger(__name__)


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
