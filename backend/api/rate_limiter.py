import logging
from django.core.cache import cache
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import Throttled

logger = logging.getLogger(__name__)


class RateLimitExceeded(Throttled):
    """Custom throttle exception for rate limiting"""
    pass


class AuthAttemptRateLimiter:
    """Rate limiter for authentication attempts"""

    @staticmethod
    def get_cache_key(identifier: str) -> str:
        """Generate cache key for storing attempt counts"""
        return f"auth_attempt_{identifier}"

    @classmethod
    def is_rate_limited(cls, identifier: str) -> bool:
        """Check if identifier is rate limited"""
        cache_key = cls.get_cache_key(identifier)
        attempts = cache.get(cache_key, 0)
        return attempts >= settings.RATE_LIMIT_AUTH_ATTEMPTS

    @classmethod
    def record_attempt(cls, identifier: str) -> int:
        """Record an attempt and return current count"""
        cache_key = cls.get_cache_key(identifier)
        attempts = cache.get(cache_key, 0)
        attempts += 1
        cache.set(cache_key, attempts, settings.RATE_LIMIT_AUTH_DURATION)
        logger.warning(f"Auth attempt for {identifier}: {attempts}/{settings.RATE_LIMIT_AUTH_ATTEMPTS}")
        return attempts

    @classmethod
    def reset_attempts(cls, identifier: str) -> None:
        """Reset attempt counter (called on successful login)"""
        cache_key = cls.get_cache_key(identifier)
        cache.delete(cache_key)
        logger.info(f"Auth attempts reset for {identifier}")


def check_rate_limit(email: str) -> Response | None:
    """
    Check if email is rate limited.
    Returns error Response if rate limited, None otherwise.
    """
    if AuthAttemptRateLimiter.is_rate_limited(email):
        logger.warning(f"Rate limit exceeded for {email}")
        return Response(
            {"detail": "Too many login attempts. Please try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    return None
