from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project
from apps.billing.models import Invoice, InvoiceItem


class TestInvoicesAPI(TestCase):
    def setUp(self):
        self.api = APIClient()
        # Users
        self.user = User.objects.create_user("clientuser", password="pass")
        self.staff = User.objects.create_user("staff", password="pass", is_staff=True)
        # Clients & projects
        self.client_a = Client.objects.create(
            name="Client A", email="a@a.test", main_contact_name="A", main_contact_email="a@a.test", status="active"
        )
        self.client_b = Client.objects.create(
            name="Client B", email="b@b.test", main_contact_name="B", main_contact_email="b@b.test", status="active"
        )
        ClientMember.objects.create(user=self.user, client=self.client_a, role="admin")
        self.pa = Project.objects.create(client=self.client_a, title="P1")
        pb = Project.objects.create(client=self.client_b, title="P2")
        # Invoices
        self.inv_a = Invoice.objects.create(
            client=self.client_a,
            project=self.pa,
            title="Acompte",
            status="sent",
            due_date="2025-12-31",
        )
        InvoiceItem.objects.create(invoice=self.inv_a, title="L1", quantity=1, unit_price=100)
        self.inv_b = Invoice.objects.create(
            client=self.client_b,
            project=pb,
            title="Autre",
            status="sent",
            due_date="2025-12-31",
        )
        InvoiceItem.objects.create(invoice=self.inv_b, title="L1", quantity=1, unit_price=100)

    def test_list_scoping_for_client(self):
        self.api.force_authenticate(self.user)
        resp = self.api.get("/api/invoices/")
        self.assertEqual(resp.status_code, 200)
        ids = [i["id"] for i in resp.data.get("results", resp.data)]
        self.assertIn(str(self.inv_a.id), ids if ids and isinstance(ids[0], str) else ids)
        self.assertNotIn(str(self.inv_b.id), ids if ids and isinstance(ids[0], str) else ids)

    def test_detail_and_totals(self):
        self.api.force_authenticate(self.staff)
        resp = self.api.get(f"/api/invoices/{self.inv_a.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("subtotal_ht", resp.data)
        self.assertIn("total_ttc", resp.data)

