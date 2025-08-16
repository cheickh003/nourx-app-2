"""
Serializers for billing app.
"""
from rest_framework import serializers
from .models import Invoice, InvoiceItem, Quote, QuoteItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "title",
            "description",
            "quantity",
            "unit_price",
            "total_price",
            "order",
        ]
        read_only_fields = ["id", "total_price"]


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    is_overdue = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "title",
            "status",
            "invoice_date",
            "due_date",
            "client_name",
            "project_title",
            "total_ttc",
            "paid_amount",
            "remaining_amount",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue", "remaining_amount"]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    pdf_url = serializers.SerializerMethodField()


class InvoiceCreateUpdateSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "client", "project", "title", "description", "status", 
            "invoice_date", "due_date", "tax_rate", "payment_terms", "notes", "items"
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        invoice.calculate_totals()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)

        if items_data is not None:
            # Simple update: clear existing items and create new ones
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
        
        instance.calculate_totals()
        return instance



    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "title",
            "description",
            "status",
            "invoice_date",
            "due_date",
            "client",
            "client_name",
            "project",
            "project_title",
            "subtotal_ht",
            "tax_rate",
            "tax_amount",
            "total_ttc",
            "paid_amount",
            "remaining_amount",
            "currency",
            "payment_terms",
            "notes",
            "is_overdue",
            "pdf_url",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "is_overdue",
            "remaining_amount",
            "pdf_url",
        ]

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            try:
                return obj.pdf_file.url
            except Exception:
                return None
        return None

