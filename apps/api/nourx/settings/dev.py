"""
Development settings for NOURX project.
"""
from .base import *

# Debug
DEBUG = True

# Debug toolbar
if DEBUG:
    INSTALLED_APPS += ["debug_toolbar", "django_extensions"]
    MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
    
    INTERNAL_IPS = [
        "127.0.0.1",
        "localhost",
    ]

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# More permissive CORS for development
CORS_ALLOW_ALL_ORIGINS = True

# Disable CSRF for development (API testing)
# CSRF_COOKIE_HTTPONLY = False

# Logging
LOGGING["loggers"]["django"]["level"] = "DEBUG"
LOGGING["loggers"]["nourx"]["level"] = "DEBUG"
