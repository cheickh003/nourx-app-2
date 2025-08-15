from django.test import TestCase
from rest_framework.test import APIClient


class TestCoreEndpoints(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check(self):
        resp = self.client.get("/api/health/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get("status"), "healthy")

    def test_schema_available(self):
        resp = self.client.get("/api/schema/")
        self.assertEqual(resp.status_code, 200)

    def test_admin_redirects_to_login(self):
        # Admin should redirect to login (302) when not authenticated
        resp = self.client.get("/admin/", follow=False)
        self.assertIn(resp.status_code, (301, 302))
