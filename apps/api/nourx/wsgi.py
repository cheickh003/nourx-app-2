"""
WSGI config for NOURX project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nourx.settings.prod")

application = get_wsgi_application()
