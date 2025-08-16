"""
Views for billing app.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminUser
from apps.clients.models import ClientMember
from .models import Invoice
from .serializers import (
    InvoiceListSerializer,
    InvoiceDetailSerializer,
    InvoiceCreateUpdateSerializer,
)

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    Admins can Create, Read, Update, Delete.
    Clients have Read-Only access to their own invoices.
    """
    queryset = Invoice.objects.select_related("client", "project").prefetch_related("items")
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InvoiceCreateUpdateSerializer
        elif self.action == 'list':
            return InvoiceListSerializer
        return InvoiceDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        else:
            # Read-only for authenticated users; queryset is scoped to their clients
            from rest_framework.permissions import IsAuthenticated
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or (hasattr(user, "profile") and user.profile.role == "admin"):
            return self.queryset
        
        client_ids = list(ClientMember.objects.filter(user=user).values_list("client_id", flat=True))
        return self.queryset.filter(client__id__in=client_ids)

    # ... (keep existing PDF actions)
