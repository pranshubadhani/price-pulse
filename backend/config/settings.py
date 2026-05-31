from pathlib import Path
import os
import sys
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

BASE_DIR = Path(__file__).resolve().parent.parent


def _normalize_host(raw_host: str) -> str:
    candidate = raw_host.strip()
    if not candidate:
        return ""
    if "://" in candidate:
        parsed = urlparse(candidate)
        candidate = parsed.netloc or parsed.path
    candidate = candidate.split("/")[0].strip()
    return candidate


def _env_list(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


def _ensure_rediss_ssl_cert_reqs(url: str) -> str:
    """Ensure rediss URLs include ssl_cert_reqs for redis-py/kombu compatibility."""
    if not url.startswith("rediss://"):
        return url

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "ssl_cert_reqs" in query:
        return url

    # Can be overridden in env when stricter validation is desired.
    query["ssl_cert_reqs"] = os.getenv("CELERY_REDIS_SSL_CERT_REQS", "CERT_NONE")
    return urlunparse(parsed._replace(query=urlencode(query)))

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-key-change-this-to-32-plus-chars")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
IS_TESTING = "test" in sys.argv
ALLOWED_HOSTS = [_normalize_host(host) for host in _env_list("ALLOWED_HOSTS", "*")]
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "accounts",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "pricepulse"),
        "USER": os.getenv("POSTGRES_USER", "pricepulse"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "pricepulse"),
        "HOST": os.getenv("POSTGRES_HOST", "postgres"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "dev-secret")),
}

CELERY_BROKER_URL = _ensure_rediss_ssl_cert_reqs(os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"))
CELERY_RESULT_BACKEND = _ensure_rediss_ssl_cert_reqs(os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0"))
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60

CELERY_BEAT_SCHEDULE = {
    "check-product-prices-every-24h": {
        "task": "api.tasks.check_product_prices",
        "schedule": float(os.getenv("PRICE_CHECK_INTERVAL_SECONDS", str(24 * 60 * 60))),
    },
}

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@pricepulse.local")
EMAIL_BACKEND = "sendgrid_backend.SendgridBackend" if SENDGRID_API_KEY else "django.core.mail.backends.console.EmailBackend"

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "True" if DEBUG else "False").lower() == "true"
LOG_DIR = BASE_DIR / "logs"

if LOG_TO_FILE:
    LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING_HANDLERS = {
    "console": {
        "class": "logging.StreamHandler",
        "formatter": "verbose",
    },
}

if LOG_TO_FILE:
    LOGGING_HANDLERS["file"] = {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": LOG_DIR / "pricepulse.log",
        "maxBytes": 1024 * 1024 * 10,
        "backupCount": 10,
        "formatter": "verbose",
    }

DEFAULT_LOG_HANDLERS = ["console"]
if LOG_TO_FILE:
    DEFAULT_LOG_HANDLERS.append("file")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {name} {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": LOGGING_HANDLERS,
    "loggers": {
        "django": {
            "handlers": DEFAULT_LOG_HANDLERS,
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": DEFAULT_LOG_HANDLERS,
            "level": "WARNING",
            "propagate": False,
        },
        "api": {
            "handlers": DEFAULT_LOG_HANDLERS,
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "accounts": {
            "handlers": DEFAULT_LOG_HANDLERS,
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_AUTH_ATTEMPTS = int(os.getenv("RATE_LIMIT_AUTH_ATTEMPTS", "5"))
RATE_LIMIT_AUTH_DURATION = int(os.getenv("RATE_LIMIT_AUTH_DURATION", "300"))  # seconds

# ============================================================================
# SECURITY SETTINGS
# ============================================================================
# SECURE_SSL_REDIRECT is disabled in dev/test environments
# In production, SSL should be handled at the load balancer/proxy level
if not DEBUG and not IS_TESTING:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        "default-src": ("'self'",),
        "script-src": ("'self'",),
        "style-src": ("'self'", "'unsafe-inline'"),
    }
else:
    SECURE_SSL_REDIRECT = False

# ============================================================================
# CORS SETTINGS
# ============================================================================
CORS_ALLOWED_ORIGINS = _env_list("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

# ============================================================================
# MONITORING & HEALTH CHECKS
# ============================================================================
HEALTH_CHECK_ENABLED = os.getenv("HEALTH_CHECK_ENABLED", "True").lower() == "true"
METRICS_ENABLED = os.getenv("METRICS_ENABLED", "True").lower() == "true"
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN and not IS_TESTING:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    import logging

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            LoggingIntegration(
                level=logging.INFO,       # breadcrumbs from INFO+
                event_level=logging.ERROR,  # send to Sentry on ERROR+
            ),
        ],
        traces_sample_rate=0.2,  # 20% of transactions for performance
        send_default_pii=False,  # don't send user PII
        environment=os.getenv("DJANGO_ENV", "production"),
    )

CRON_SECRET = os.getenv("CRON_SECRET", "")

# ============================================================================
# URL CONFIGURATION
# ============================================================================
APPEND_SLASH = True
PREPEND_WWW = False
