"""
URL configuration for NOURX project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

admin_url = getattr(settings, "ADMIN_URL", "admin/")

urlpatterns = [
    # Admin (configurable path in production)
    path(admin_url, admin.site.urls),
    
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    
    # API Routes
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.projects.urls")),
    path("api/", include("apps.tasks.urls")),
    # Other app URLs will be added as we implement them
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Debug toolbar in development
if settings.DEBUG and "debug_toolbar" in settings.INSTALLED_APPS:
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
