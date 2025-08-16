"""
Views for clients app (admin CRUD only).
"""
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsNourxStaff
from .models import Client, ClientMember
from .serializers import ClientSerializer, ClientMemberSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsNourxStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "industry", "company_size"]
    search_fields = ["name", "email", "main_contact_name", "main_contact_email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

class ClientMemberViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ClientMember.objects.select_related("user", "client").all()
    permission_classes = [IsNourxStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["client"]
    search_fields = ["user__first_name", "user__last_name", "user__email", "client__name"]
    ordering = ["-created_at"]

    serializer_class = ClientMemberSerializer
