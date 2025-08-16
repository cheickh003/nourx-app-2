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
    path("admin-stats/", views.AdminDashboardStatsView.as_view(), name="admin-stats"),
    path("settings/", views.AppSettingsView.as_view(), name="app-settings"),
    path("staff/", views.StaffUsersView.as_view(), name="staff-users"),
    path("admin-stats", views.AdminDashboardStatsView.as_view()),
    # Optional alternate mount used in some frontends
    path("core/admin-stats/", views.AdminDashboardStatsView.as_view()),
    path("core/admin-stats", views.AdminDashboardStatsView.as_view()),
]
