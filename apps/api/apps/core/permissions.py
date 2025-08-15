"""
Custom permissions for the NOURX application.
"""
from rest_framework import permissions
from django.contrib.auth.models import User
from apps.clients.models import ClientMember


class IsNourxStaff(permissions.BasePermission):
    """
    Permission that allows access only to NOURX staff members.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and is NOURX staff.
        """
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff have access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has admin role in their profile
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == 'admin'
        
        return False


class IsClientMember(permissions.BasePermission):
    """
    Permission that allows access only to client members.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and is a client member.
        """
        if not request.user.is_authenticated:
            return False
        
        # Check if user is a member of any client
        return ClientMember.objects.filter(user=request.user).exists()


class ClientScopedPermission(permissions.BasePermission):
    """
    Permission that restricts access based on client membership.
    Users can only access objects related to their clients.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated.
        """
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access this specific object based on client scope.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can access everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Get the client associated with this object
        client = self._get_object_client(obj)
        if not client:
            return False
        
        # Check if user is a member of this client
        return self._is_client_member(request.user, client)
    
    def _is_nourx_staff(self, user):
        """Check if user is NOURX staff."""
        if user.is_superuser or user.is_staff:
            return True
        
        if hasattr(user, 'profile'):
            return user.profile.role == 'admin'
        
        return False
    
    def _get_object_client(self, obj):
        """Get the client associated with an object."""
        # Direct client field
        if hasattr(obj, 'client'):
            return obj.client
        
        # Through project
        if hasattr(obj, 'project') and obj.project:
            return obj.project.client
        
        # Through invoice
        if hasattr(obj, 'invoice') and obj.invoice:
            return obj.invoice.client
        
        # Through task
        if hasattr(obj, 'task') and obj.task:
            return obj.task.project.client
        
        # Through ticket
        if hasattr(obj, 'ticket') and obj.ticket:
            return obj.ticket.client
        
        # Through document
        if hasattr(obj, 'document') and obj.document:
            return obj.document.project.client
        
        return None
    
    def _is_client_member(self, user, client):
        """Check if user is a member of the given client."""
        return ClientMember.objects.filter(user=user, client=client).exists()


class ClientAdminPermission(ClientScopedPermission):
    """
    Permission for client admin actions (create, update, delete).
    Requires user to be admin or owner of the client.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can perform admin actions on this object.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can do everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Read-only for non-admin actions
        if request.method in permissions.SAFE_METHODS:
            return super().has_object_permission(request, view, obj)
        
        # Get the client associated with this object
        client = self._get_object_client(obj)
        if not client:
            return False
        
        # Check if user is admin/owner of this client
        return self._is_client_admin(request.user, client)
    
    def _is_client_admin(self, user, client):
        """Check if user is admin or owner of the given client."""
        membership = ClientMember.objects.filter(user=user, client=client).first()
        if not membership:
            return False
        
        return membership.role in ['owner', 'admin']


class BillingAccessPermission(ClientScopedPermission):
    """
    Permission for billing-related objects.
    Requires specific billing permissions for client members.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access billing information.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can access everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Get the client associated with this object
        client = self._get_object_client(obj)
        if not client:
            return False
        
        # Check if user has billing permissions
        membership = ClientMember.objects.filter(user=request.user, client=client).first()
        if not membership:
            return False
        
        return membership.can_view_billing or membership.role in ['owner', 'admin']


class TeamManagementPermission(ClientScopedPermission):
    """
    Permission for team management actions.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can manage team members.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can do everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Read-only for safe methods
        if request.method in permissions.SAFE_METHODS:
            return super().has_object_permission(request, view, obj)
        
        # Get the client associated with this object
        client = self._get_object_client(obj)
        if not client:
            return False
        
        # Check if user has team management permissions
        membership = ClientMember.objects.filter(user=request.user, client=client).first()
        if not membership:
            return False
        
        return (membership.can_manage_team or 
                membership.role in ['owner', 'admin'])


class DocumentVisibilityPermission(ClientScopedPermission):
    """
    Permission for document access based on visibility settings.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access document based on visibility.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can access everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Check basic client scope first
        if not super().has_object_permission(request, view, obj):
            return False
        
        # For documents, check visibility
        if hasattr(obj, 'visibility'):
            if obj.visibility == 'internal':
                # Internal documents only for NOURX staff
                return self._is_nourx_staff(request.user)
            elif obj.visibility == 'restricted':
                # Restricted documents need special permission logic
                # For now, same as public but this could be extended
                return True
        
        return True


class SupportTicketPermission(ClientScopedPermission):
    """
    Permission for support tickets with privacy settings.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access support ticket.
        """
        if not request.user.is_authenticated:
            return False
        
        # NOURX staff can access everything
        if self._is_nourx_staff(request.user):
            return True
        
        # Check basic client scope first
        if not super().has_object_permission(request, view, obj):
            return False
        
        # For tickets, check if it's public
        if hasattr(obj, 'is_public') and not obj.is_public:
            # Private tickets only for NOURX staff
            return self._is_nourx_staff(request.user)
        
        return True


class AuditLogPermission(permissions.BasePermission):
    """
    Permission for audit logs - read-only for NOURX staff only.
    """
    
    def has_permission(self, request, view):
        """
        Only NOURX staff can access audit logs.
        """
        if not request.user.is_authenticated:
            return False
        
        # Only NOURX staff
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == 'admin'
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Read-only access for audit logs.
        """
        return request.method in permissions.SAFE_METHODS
