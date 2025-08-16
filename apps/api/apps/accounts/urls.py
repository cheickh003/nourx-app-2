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
    path("set-password", views.set_password_view, name="set-password-no-slash"),
    path("set-password/", views.set_password_view, name="set-password"),
    path("create-client-user", views.ClientUserCreateView.as_view(), name="create-client-user-no-slash"),
    path("create-client-user/", views.ClientUserCreateView.as_view(), name="create-client-user"),
    path("reset-password", views.reset_password_view, name="reset-password-no-slash"),
    path("reset-password/", views.reset_password_view, name="reset-password"),
    path("users/<int:user_id>/status", views.update_user_status_view, name="user-status-no-slash"),
    path("users/<int:user_id>/status/", views.update_user_status_view, name="user-status"),
    path("logout", views.logout_view),
    path("csrf/", views.csrf_token_view, name="csrf-token"),
    path("csrf", views.csrf_token_view),
]
