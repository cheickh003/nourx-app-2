"""
Production settings for NOURX project.
"""
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

from .base import *

# Debug
DEBUG = False

# Security
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = config("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True, cast=bool)
SECURE_HSTS_PRELOAD = config("SECURE_HSTS_PRELOAD", default=True, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = config("SECURE_CONTENT_TYPE_NOSNIFF", default=True, cast=bool)
SECURE_BROWSER_XSS_FILTER = config("SECURE_BROWSER_XSS_FILTER", default=True, cast=bool)

# Session security
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=True, cast=bool)
SESSION_COOKIE_HTTPONLY = config("SESSION_COOKIE_HTTPONLY", default=True, cast=bool)
SESSION_COOKIE_SAMESITE = config("SESSION_COOKIE_SAMESITE", default="Lax")

# CSRF security
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=True, cast=bool)
CSRF_COOKIE_HTTPONLY = config("CSRF_COOKIE_HTTPONLY", default=True, cast=bool)
CSRF_COOKIE_SAMESITE = config("CSRF_COOKIE_SAMESITE", default="Lax")

# Admin access restriction
ADMIN_URL = config("ADMIN_URL", default="admin/")

# Sentry integration
SENTRY_DSN = config("SENTRY_DSN", default="")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=True,
        environment="production",
    )

# Database configuration with connection pooling
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["OPTIONS"] = {
    "MAX_CONNS": 20,
    "MIN_CONNS": 5,
}

# Cache configuration
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Session backend
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Static files compression and minification
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Log to file in production
LOGGING["handlers"]["file"] = {
    "class": "logging.handlers.RotatingFileHandler",
    "filename": BASE_DIR / "logs" / "django.log",
    "maxBytes": 1024*1024*15,  # 15MB
    "backupCount": 10,
    "formatter": "verbose",
}

LOGGING["loggers"]["django"]["handlers"] = ["console", "file"]
LOGGING["loggers"]["nourx"]["handlers"] = ["console", "file"]

# Ensure log directory exists
os.makedirs(BASE_DIR / "logs", exist_ok=True)
