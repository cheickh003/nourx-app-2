"""
Base settings for NOURX project.
"""
import os
from pathlib import Path

import dj_database_url
from decouple import config

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Security
SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-me")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost", cast=lambda x: [i.strip() for i in x.split(",")])

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "channels",
    "django_filters",
    "django_celery_beat",
    "storages",
    "drf_spectacular",
]

LOCAL_APPS = [
    "apps.core",
    "apps.accounts",
    "apps.clients",
    "apps.projects",
    "apps.tasks",
    "apps.documents",
    "apps.billing",
    "apps.payments",
    "apps.support",
    "apps.audit",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

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

ROOT_URLCONF = "nourx.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "nourx.wsgi.application"
ASGI_APPLICATION = "nourx.asgi.application"

# Database
DATABASE_URL = config("DATABASE_URL", default="sqlite:///db.sqlite3")
DATABASES = {"default": dj_database_url.parse(DATABASE_URL)}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Abidjan"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# URL handling
APPEND_SLASH = False

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# DRF Router: make trailing slash optional to be resilient to proxies
DEFAULT_ROUTER_TRAILING_SLASH = r'/?'

# DRF Spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "NOURX API",
    "DESCRIPTION": "API pour l'espace client NOURX",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/",
}

# CORS settings
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", 
    default="http://localhost:3000", 
    cast=lambda x: [i.strip() for i in x.split(",")]
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS", 
    default="http://localhost:3000", 
    cast=lambda x: [i.strip() for i in x.split(",")]
)

# Redis configuration
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")

# Channels
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default=REDIS_URL)
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default=REDIS_URL)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# AWS/S3 Configuration
USE_S3 = config("USE_S3", default=True, cast=bool)

if USE_S3:
    # Core S3/MinIO settings
    AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
    AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="nourx-bucket")
    AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="us-east-1")
    AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default=None)
    AWS_S3_USE_SSL = config("AWS_S3_USE_SSL", default=True, cast=bool)
    AWS_DEFAULT_ACL = config("AWS_DEFAULT_ACL", default="private")

    # URL generation behavior
    AWS_S3_URL_PROTOCOL = config("AWS_S3_URL_PROTOCOL", default=("https:" if AWS_S3_USE_SSL else "http:"))
    AWS_S3_ADDRESSING_STYLE = config("AWS_S3_ADDRESSING_STYLE", default="path")  # better with MinIO
    AWS_S3_SIGNATURE_VERSION = config("AWS_S3_SIGNATURE_VERSION", default="s3v4")
    AWS_QUERYSTRING_AUTH = config("AWS_QUERYSTRING_AUTH", default=True, cast=bool)
    AWS_QUERYSTRING_EXPIRE = config("AWS_QUERYSTRING_EXPIRE", default=3600, cast=int)

    # Custom domain for browser access (important when endpoint is internal like 'minio:9000')
    # In dev with MinIO, prefer browser-accessible domain + include bucket for path-style
    _bucket = AWS_STORAGE_BUCKET_NAME
    AWS_S3_CUSTOM_DOMAIN = config(
        "AWS_S3_CUSTOM_DOMAIN",
        default=(f"localhost:9000/{_bucket}" if DEBUG and AWS_S3_ENDPOINT_URL else None),
    )

    AWS_S3_OBJECT_PARAMETERS = {
        "CacheControl": "max-age=86400",
    }
    
    # Static and Media files via S3
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "storages.backends.s3boto3.S3StaticStorage",
        },
    }

# Email configuration
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=1025, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=False, cast=bool)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", default=False, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="nourx@localhost")

# Ensure TLS/SSL are not both enabled simultaneously
if EMAIL_USE_SSL:
    EMAIL_USE_TLS = False

# Support attachments policy
SUPPORT_ALLOWED_MIME_TYPES = config(
    "SUPPORT_ALLOWED_MIME_TYPES",
    default=
    "image/jpeg,image/png,image/gif,application/pdf,application/msword,"
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
    "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
    "text/plain,application/zip",
    cast=lambda x: [i.strip() for i in x.split(",")],
)
SUPPORT_ATTACHMENT_MAX_SIZE = config("SUPPORT_ATTACHMENT_MAX_SIZE", default=20971520, cast=int)  # 20 MB
FRONTEND_BASE_URL = config("FRONTEND_BASE_URL", default="http://localhost:3000")

# CinetPay Configuration
CINETPAY_API_KEY = config("CINETPAY_API_KEY", default="")
CINETPAY_SITE_ID = config("CINETPAY_SITE_ID", default="")
CINETPAY_SECRET_KEY = config("CINETPAY_SECRET_KEY", default="")
CINETPAY_BASE_URL = config("CINETPAY_BASE_URL", default="https://sandbox-api-checkout.cinetpay.com")

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": config("LOGGING_LEVEL", default="INFO"),
            "propagate": False,
        },
        "nourx": {
            "handlers": ["console"],
            "level": config("LOGGING_LEVEL", default="INFO"),
            "propagate": False,
        },
    },
}
