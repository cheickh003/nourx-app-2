"""
Serializers for payments app.
"""
from rest_framework import serializers
from apps.billing.models import Invoice
from .models import Payment


class PaymentInitSerializer(serializers.Serializer):
    invoice_id = serializers.UUIDField()

    def validate_invoice_id(self, value):
        try:
            invoice = Invoice.objects.get(id=value)
        except Invoice.DoesNotExist:
            raise serializers.ValidationError("Invoice not found")
        if invoice.status in ["paid", "refunded", "cancelled"]:
            raise serializers.ValidationError("Invoice is not payable")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "client",
            "amount",
            "currency",
            "status",
            "cinetpay_transaction_id",
            "cinetpay_checkout_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

