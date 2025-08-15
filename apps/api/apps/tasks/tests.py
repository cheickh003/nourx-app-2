from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project
from apps.tasks.models import Task


class TestTaskScoping(TestCase):
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
        self.pa = Project.objects.create(client=self.client_a, title="P1")
        self.pb = Project.objects.create(client=self.client_b, title="P2")

        # Tasks
        self.t1 = Task.objects.create(project=self.pa, title="T1", assigned_to=self.user, created_by=self.staff)
        self.t2 = Task.objects.create(project=self.pb, title="T2", created_by=self.staff)

    def test_user_sees_only_own_client_tasks(self):
        self.api.force_authenticate(user=self.user)
        resp = self.api.get("/api/tasks/")
        self.assertEqual(resp.status_code, 200)
        ids = [t["id"] for t in resp.data.get("results", resp.data)]
        self.assertIn(str(self.t1.id), ids if ids and isinstance(ids[0], str) else ids)
        self.assertNotIn(str(self.t2.id), ids if ids and isinstance(ids[0], str) else ids)

    def test_my_tasks_returns_tasks_assigned_to_user(self):
        self.api.force_authenticate(user=self.user)
        resp = self.api.get("/api/tasks/my_tasks/")
        self.assertEqual(resp.status_code, 200)
        ids = [t["id"] for t in resp.data]
        self.assertTrue(str(self.t1.id) in ids or self.t1.id in ids)
        self.assertFalse(str(self.t2.id) in ids or self.t2.id in ids)

