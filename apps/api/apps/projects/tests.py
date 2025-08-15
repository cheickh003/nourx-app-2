from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project


class TestProjectScoping(TestCase):
    def setUp(self):
        self.api = APIClient()

        # Users
        self.user = User.objects.create_user("clientuser", password="pass")
        self.other = User.objects.create_user("other", password="pass")
        self.staff = User.objects.create_user("staff", password="pass", is_staff=True)

        # Clients
        self.client_a = Client.objects.create(
            name="Client A", email="a@a.test", main_contact_name="A", main_contact_email="a@a.test", status="active"
        )
        self.client_b = Client.objects.create(
            name="Client B", email="b@b.test", main_contact_name="B", main_contact_email="b@b.test", status="active"
        )

        # Memberships
        ClientMember.objects.create(user=self.user, client=self.client_a, role="admin")

        # Projects
        self.p1 = Project.objects.create(client=self.client_a, title="P1")
        self.p2 = Project.objects.create(client=self.client_b, title="P2")

    def test_user_sees_only_own_client_projects(self):
        self.api.force_authenticate(user=self.user)
        resp = self.api.get("/api/projects/")
        self.assertEqual(resp.status_code, 200)
        ids = [p["id"] for p in resp.data.get("results", resp.data)]
        self.assertIn(str(self.p1.id), ids if ids and isinstance(ids[0], str) else ids)
        self.assertNotIn(str(self.p2.id), ids if ids and isinstance(ids[0], str) else ids)

    def test_staff_sees_all_projects(self):
        self.api.force_authenticate(user=self.staff)
        resp = self.api.get("/api/projects/")
        self.assertEqual(resp.status_code, 200)
        ids = [p["id"] for p in resp.data.get("results", resp.data)]
        # Accept UUIDs or raw types
        self.assertTrue(
            (self.p1.id in ids or str(self.p1.id) in ids) and (self.p2.id in ids or str(self.p2.id) in ids)
        )

