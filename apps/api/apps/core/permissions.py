"""
Custom permissions for NOURX.
"""
from rest_framework import permissions
from apps.clients.models import ClientMember


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return getattr(getattr(user, 'profile', None), 'role', None) == 'admin'


class IsClientUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(getattr(user, 'profile', None), 'role', None) == 'client'


class IsNourxStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return getattr(getattr(user, 'profile', None), 'role', None) == 'admin'


class ClientScopedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff or getattr(getattr(user, 'profile', None), 'role', None) == 'admin':
            return True
        client = None
        if hasattr(obj, 'client'):
            client = obj.client
        elif hasattr(obj, 'project') and obj.project:
            client = getattr(obj.project, 'client', None)
        elif hasattr(obj, 'invoice') and obj.invoice:
            client = obj.invoice.client
        elif hasattr(obj, 'task') and obj.task:
            client = obj.task.project.client
        elif hasattr(obj, 'ticket') and obj.ticket:
            client = obj.ticket.client
        if not client:
            return False
        return ClientMember.objects.filter(user=user, client=client).exists()


class ClientAdminPermission(ClientScopedPermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff or getattr(getattr(user, 'profile', None), 'role', None) == 'admin':
            return True
        # Only owners/admins on the client can write
        client = None
        if hasattr(obj, 'client'):
            client = obj.client
        elif hasattr(obj, 'project') and obj.project:
            client = getattr(obj.project, 'client', None)
        if not client:
            return False
        membership = ClientMember.objects.filter(user=user, client=client).first()
        return bool(membership and membership.role in ('owner', 'admin'))


class DocumentVisibilityPermission(ClientScopedPermission):
    """Restrict access to documents based on visibility settings."""

    def has_object_permission(self, request, view, obj):
        # Basic client-scope first
        if not super().has_object_permission(request, view, obj):
            return False

        # Staff/admin have full access
        user = request.user
        if user.is_superuser or user.is_staff or getattr(getattr(user, 'profile', None), 'role', None) == 'admin':
            return True

        # Enforce visibility for non-staff
        visibility = getattr(obj, 'visibility', None)
        if visibility == 'internal':
            return False
        # 'restricted' and 'public' allowed for now (could be extended)
        return True


class SupportTicketPermission(ClientScopedPermission):
    """Permission for support tickets with privacy handling."""

    def has_object_permission(self, request, view, obj):
        # Basic client-scope first
        if not super().has_object_permission(request, view, obj):
            return False

        # Staff/admin have full access
        user = request.user
        if user.is_superuser or user.is_staff or getattr(getattr(user, 'profile', None), 'role', None) == 'admin':
            return True

        # If ticket is not public, only staff/admin can view
        is_public = getattr(obj, 'is_public', True)
        return bool(is_public)
