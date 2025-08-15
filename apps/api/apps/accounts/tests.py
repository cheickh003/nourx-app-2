from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class TestAuthEndpoints(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_csrf_endpoint_returns_token(self):
        resp = self.client.get("/api/auth/csrf/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("csrftoken", resp.data)

    def test_login_and_access_me_then_logout(self):
        # Without login, /api/me/ should be forbidden
        resp = self.client.get("/api/me/")
        self.assertEqual(resp.status_code, 403)

        # Login
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "testuser", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("user", resp.data)

        # Access /api/me/
        resp = self.client.get("/api/me/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get("username"), "testuser")

        # Logout
        resp = self.client.post("/api/auth/logout/")
        self.assertEqual(resp.status_code, 200)

        # After logout, /api/me/ should be forbidden again
        resp = self.client.get("/api/me/")
        self.assertEqual(resp.status_code, 403)
