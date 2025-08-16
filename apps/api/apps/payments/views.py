"""
Payment integration with CinetPay.
"""
import hmac
import hashlib
import json
import uuid
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from apps.billing.models import Invoice
from apps.core.permissions import ClientScopedPermission
from apps.clients.models import ClientMember
from .models import Payment
from .serializers import PaymentInitSerializer, PaymentSerializer


class CinetPayClient:
    def __init__(self):
        self.api_key = getattr(settings, "CINETPAY_API_KEY", "")
        self.site_id = getattr(settings, "CINETPAY_SITE_ID", "")
        self.base_url = getattr(settings, "CINETPAY_BASE_URL", "https://sandbox-api-checkout.cinetpay.com")

    def init_payment(self, data: dict):
        url = f"{self.base_url}/v2/payment"
        headers = {"Content-Type": "application/json"}
        payload = json.dumps(data)
        resp = requests.post(url, data=payload, headers=headers, timeout=15)
        return resp

    def check_payment(self, transaction_id: str):
        url = f"{self.base_url}/v2/payment/check"
        headers = {"Content-Type": "application/json"}
        payload = json.dumps({
            "transaction_id": transaction_id,
            "site_id": self.site_id,
            "apikey": self.api_key,
        })
        resp = requests.post(url, data=payload, headers=headers, timeout=15)
        return resp


class InitPaymentView(APIView):
    permission_classes = [IsAuthenticated, ClientScopedPermission]

    def post(self, request):
        serializer = PaymentInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = Invoice.objects.get(id=serializer.validated_data["invoice_id"])

        # Prevent duplicate when already paid
        if invoice.status == "paid":
            return Response({"error": "Invoice already paid"}, status=400)

        # Prepare CinetPay payload
        cp = CinetPayClient()
        transaction_id = str(uuid.uuid4())
        amount = float(invoice.total_ttc)
        currency = invoice.currency
        description = invoice.title or f"Facture {invoice.invoice_number}"

        return_url = getattr(settings, "CINETPAY_RETURN_URL", "http://localhost:3000/paiement/success")
        cancel_url = getattr(settings, "CINETPAY_CANCEL_URL", "http://localhost:3000/paiement/failed")
        notify_url = getattr(settings, "CINETPAY_NOTIFY_URL", "http://localhost:8000/api/payments/webhook/")

        payload = {
            "amount": amount,
            "currency": currency,
            "apikey": cp.api_key,
            "site_id": cp.site_id,
            "transaction_id": transaction_id,
            "description": description,
            "return_url": return_url,
            "cancel_url": cancel_url,
            "notify_url": notify_url,
            "customer_name": request.user.get_full_name() or request.user.username,
            "customer_email": request.user.email,
        }

        # Create Payment record in pending state
        payment = Payment.objects.create(
            invoice=invoice,
            client=invoice.client,
            initiated_by=request.user,
            cinetpay_transaction_id=transaction_id,
            amount=invoice.total_ttc,
            currency=currency,
            description=description,
            status="pending",
            expires_at=timezone.now() + timedelta(hours=1),
        )

        try:
            resp = cp.init_payment(payload)
            data = resp.json()
        except Exception as e:
            return Response({"error": f"Payment init error: {e}"}, status=500)

        # Expected: data["code"] == '201' and data["data"]["payment_url"], ["payment_token"]
        info = data.get("data", {})
        payment.cinetpay_payment_token = info.get("payment_token")
        payment.cinetpay_checkout_url = info.get("payment_url")
        payment.raw_response_data = data
        payment.save(update_fields=["cinetpay_payment_token", "cinetpay_checkout_url", "raw_response_data", "updated_at"])

        if not payment.cinetpay_checkout_url:
            return Response({"error": "No checkout URL returned", "provider": data}, status=502)

        return Response({
            "checkout_url": payment.cinetpay_checkout_url,
            "payment": PaymentSerializer(payment).data,
        })


@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Verify HMAC signature from 'x-token'
        secret = getattr(settings, "CINETPAY_SECRET_KEY", "")
        received = request.headers.get("x-token") or request.headers.get("X-Token")
        body_bytes = request.body or b""
        computed = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        if not received or not hmac.compare_digest(received, computed):
            return Response({"error": "Invalid signature"}, status=403)

        try:
            payload = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            payload = {}

        transaction_id = payload.get("transaction_id") or payload.get("transactionId")
        status_str = payload.get("status") or payload.get("status_payment") or ""

        if not transaction_id:
            return Response({"error": "Missing transaction_id"}, status=400)

        try:
            payment = Payment.objects.get(cinetpay_transaction_id=transaction_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        payment.webhook_payload = payload

        # Re-check with CinetPay to confirm
        cp = CinetPayClient()
        try:
            resp = cp.check_payment(transaction_id)
            data = resp.json()
        except Exception:
            data = {}

        result = (data.get("data") or {}).get("status") or status_str
        if str(result).lower() in ["accepted", "success", "completed"]:
            payment.status = "completed"
            payment.completed_at = timezone.now()
            # Mark invoice paid if fully paid
            invoice = payment.invoice
            invoice.paid_amount = invoice.total_ttc
            invoice.status = "paid"
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["paid_amount", "status", "paid_at", "updated_at"])
        elif str(result).lower() in ["pending", "processing"]:
            payment.status = "processing"
        else:
            payment.status = "failed"

        payment.raw_response_data = data
        payment.save(update_fields=["status", "completed_at", "raw_response_data", "webhook_payload", "updated_at"])

        return Response({"ok": True})


class CheckPaymentView(APIView):
    permission_classes = [IsAuthenticated, ClientScopedPermission]

    def get(self, request):
        transaction_id = request.query_params.get("transaction_id")
        if not transaction_id:
            return Response({"error": "transaction_id required"}, status=400)
        try:
            payment = Payment.objects.get(cinetpay_transaction_id=transaction_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)
        cp = CinetPayClient()
        try:
            resp = cp.check_payment(transaction_id)
            data = resp.json()
        except Exception as e:
            return Response({"error": f"check error: {e}"}, status=500)

        result = (data.get("data") or {}).get("status")
        if str(result).lower() in ["accepted", "success", "completed"]:
            payment.status = "completed"
            payment.completed_at = timezone.now()
            invoice = payment.invoice
            invoice.paid_amount = invoice.total_ttc
            invoice.status = "paid"
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["paid_amount", "status", "paid_at", "updated_at"])
            payment.save(update_fields=["status", "completed_at", "updated_at"])

        return Response({"status": payment.status, "provider": data})


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve payments scoped to the current user's clients."""
    serializer_class = PaymentSerializer
    permission_classes = [ClientScopedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "client", "invoice"]
    search_fields = ["cinetpay_transaction_id", "description"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Payment.objects.select_related("invoice", "client")
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        if user.is_staff or (hasattr(user, "profile") and user.profile.role == "admin"):
            return qs
        client_ids = list(
            ClientMember.objects.filter(user=user).values_list("client_id", flat=True)
        )
        return qs.filter(client__id__in=client_ids)
