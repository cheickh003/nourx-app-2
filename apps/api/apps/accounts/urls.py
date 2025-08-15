"""
URL patterns for accounts app.
"""
from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("login", views.login_view),
    path("logout/", views.logout_view, name="logout"),
    path("logout", views.logout_view),
    path("csrf/", views.csrf_token_view, name="csrf-token"),
    path("csrf", views.csrf_token_view),
]
