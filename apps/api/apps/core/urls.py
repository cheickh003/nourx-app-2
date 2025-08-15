"""
URL patterns for core app.
"""
from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("me/", views.CurrentUserView.as_view(), name="current-user"),
    path("me", views.CurrentUserView.as_view()),
    path("health/", views.HealthCheckView.as_view(), name="health-check"),
    path("health", views.HealthCheckView.as_view()),
]
