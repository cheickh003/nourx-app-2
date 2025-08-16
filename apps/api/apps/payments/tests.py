from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from rest_framework.test import APIClient
import hmac, hashlib, json

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project
from apps.billing.models import Invoice, InvoiceItem
from apps.payments.models import Payment


class TestPaymentsAPI(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user("clientuser", password="pass", email="client@example.com")
        self.client_a = Client.objects.create(
            name="Client A", email="a@a.test", main_contact_name="A", main_contact_email="a@a.test", status="active"
        )
        ClientMember.objects.create(user=self.user, client=self.client_a, role="admin")
        self.pa = Project.objects.create(client=self.client_a, title="P1")
        self.inv = Invoice.objects.create(client=self.client_a, project=self.pa, title="Acompte", status="sent", due_date="2030-01-01")
        InvoiceItem.objects.create(invoice=self.inv, title="L1", quantity=1, unit_price=100)

    @patch("apps.payments.views.CinetPayClient.init_payment")
    def test_init_payment_returns_checkout(self, mock_init):
        self.api.force_authenticate(self.user)
        mock_init.return_value.json.return_value = {
            "code": "201",
            "message": "CREATED",
            "data": {
                "payment_url": "https://checkout.cinetpay.com/pay/xyz",
                "payment_token": "tok_abc",
            },
        }
        resp = self.api.post("/api/payments/init/", {"invoice_id": str(self.inv.id)}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn("checkout_url", resp.data)
        self.assertTrue(Payment.objects.filter(invoice=self.inv).exists())

    @patch("apps.payments.views.CinetPayClient.check_payment")
    def test_webhook_marks_paid(self, mock_check):
        # Create pending payment
        p = Payment.objects.create(
            invoice=self.inv, client=self.client_a, initiated_by=self.user,
            cinetpay_transaction_id="tx123", amount=self.inv.total_ttc, currency=self.inv.currency, status="pending"
        )
        payload = {"transaction_id": "tx123", "status": "ACCEPTED"}
        secret = "test_secret"
        with self.settings(CINETPAY_SECRET_KEY=secret):
            sig = hmac.new(secret.encode("utf-8"), json.dumps(payload).encode("utf-8"), hashlib.sha256).hexdigest()
            mock_check.return_value.json.return_value = {"data": {"status": "ACCEPTED"}}
            resp = self.api.post("/api/payments/webhook/", data=json.dumps(payload), content_type="application/json", HTTP_X_TOKEN=sig)
            self.assertEqual(resp.status_code, 200)
            p.refresh_from_db()
            self.assertEqual(p.status, "completed")
            self.inv.refresh_from_db()
            self.assertEqual(self.inv.status, "paid")
