"""
Mixins for Django REST Framework views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import MethodNotAllowed
from django.core.exceptions import ValidationError
from apps.clients.models import ClientMember
from .permissions import IsNourxStaff


class ClientScopedMixin:
    """
    Mixin that automatically filters queryset based on user's client membership.
    """
    
    def get_queryset(self):
        """
        Filter queryset based on user's client access.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # NOURX staff can see everything
        if self._is_nourx_staff(user):
            return queryset
        
        # Filter by client membership
        return self._filter_by_client_access(queryset, user)
    
    def _is_nourx_staff(self, user):
        """Check if user is NOURX staff."""
        if user.is_superuser or user.is_staff:
            return True
        
        if hasattr(user, 'profile'):
            return user.profile.role == 'admin'
        
        return False
    
    def _filter_by_client_access(self, queryset, user):
        """
        Filter queryset based on user's client memberships.
        Override this method for specific filtering logic.
        """
        # Get user's client memberships
        client_memberships = ClientMember.objects.filter(user=user)
        if not client_memberships.exists():
            return queryset.none()
        
        client_ids = client_memberships.values_list('client_id', flat=True)
        
        # Determine the filter field based on the model
        model = queryset.model
        filter_field = self._get_client_filter_field(model)
        
        if filter_field:
            filter_kwargs = {f"{filter_field}__in": client_ids}
            return queryset.filter(**filter_kwargs)
        
        return queryset.none()
    
    def _get_client_filter_field(self, model):
        """
        Determine the field to filter by for client access.
        """
        model_name = model.__name__.lower()
        
        # Direct client relationship
        if hasattr(model, 'client'):
            return 'client'
        
        # Through project
        if hasattr(model, 'project'):
            return 'project__client'
        
        # Through invoice
        if hasattr(model, 'invoice'):
            return 'invoice__client'
        
        # Through task
        if hasattr(model, 'task'):
            return 'task__project__client'
        
        # Through ticket
        if hasattr(model, 'ticket'):
            return 'ticket__client'
        
        # Through document
        if hasattr(model, 'document'):
            return 'document__project__client'
        
        # Special cases
        if model_name == 'clientmember':
            return 'client'
        elif model_name == 'milestone':
            return 'project__client'
        elif model_name == 'documentfolder':
            return 'project__client'
        elif model_name == 'documentaccess':
            return 'document__project__client'
        elif model_name == 'quoteitem':
            return 'quote__client'
        elif model_name == 'invoiceitem':
            return 'invoice__client'
        elif model_name == 'taskcomment':
            return 'task__project__client'
        elif model_name == 'taskattachment':
            return 'task__project__client'
        elif model_name == 'paymentattempt':
            return 'invoice__client'
        elif model_name == 'paymentwebhook':
            return 'payment__client'
        elif model_name == 'ticketmessage':
            return 'ticket__client'
        elif model_name == 'ticketattachment':
            return 'ticket__client'
        
        return None


class AuditLoggingMixin:
    """
    Mixin that automatically logs actions to audit trail.
    """
    
    def perform_create(self, serializer):
        """Log create action."""
        instance = serializer.save()
        self._log_action('create', instance)
    
    def perform_update(self, serializer):
        """Log update action."""
        # Get old values before update
        old_instance = self.get_object()
        old_values = self._get_model_values(old_instance)
        
        instance = serializer.save()
        new_values = self._get_model_values(instance)
        
        self._log_action('update', instance, old_values=old_values, new_values=new_values)
    
    def perform_destroy(self, instance):
        """Log delete action."""
        self._log_action('delete', instance)
        instance.delete()
    
    def _log_action(self, action, instance, old_values=None, new_values=None):
        """Log action to audit trail."""
        from apps.audit.models import AuditLog
        
        # Get request metadata
        request = getattr(self, 'request', None)
        if not request:
            return
        
        # Get client and project context
        client = self._get_instance_client(instance)
        project = self._get_instance_project(instance)
        
        AuditLog.log_action(
            actor=request.user if request.user.is_authenticated else None,
            action=action,
            description=f"{action.title()} {instance._meta.verbose_name}: {str(instance)}",
            content_object=instance,
            old_values=old_values,
            new_values=new_values,
            client=client,
            project=project,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            session_key=request.session.session_key if hasattr(request, 'session') else None
        )
    
    def _get_model_values(self, instance):
        """Get model field values as dict."""
        values = {}
        for field in instance._meta.fields:
            if not field.name.endswith('_at'):  # Skip timestamps
                try:
                    value = getattr(instance, field.name)
                    if value is not None:
                        values[field.name] = str(value)
                except Exception:
                    pass
        return values
    
    def _get_instance_client(self, instance):
        """Get client associated with instance."""
        if hasattr(instance, 'client'):
            return instance.client
        elif hasattr(instance, 'project') and instance.project:
            return instance.project.client
        elif hasattr(instance, 'invoice') and instance.invoice:
            return instance.invoice.client
        elif hasattr(instance, 'task') and instance.task:
            return instance.task.project.client
        elif hasattr(instance, 'ticket') and instance.ticket:
            return instance.ticket.client
        elif hasattr(instance, 'document') and instance.document:
            return instance.document.project.client
        return None
    
    def _get_instance_project(self, instance):
        """Get project associated with instance."""
        if hasattr(instance, 'project'):
            return instance.project
        elif hasattr(instance, 'task') and instance.task:
            return instance.task.project
        elif hasattr(instance, 'document') and instance.document:
            return instance.document.project
        elif hasattr(instance, 'ticket') and instance.ticket:
            return instance.ticket.project
        return None
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class BaseNourxViewSet(ClientScopedMixin, AuditLoggingMixin, viewsets.ModelViewSet):
    """
    Base ViewSet for NOURX with client scoping and audit logging.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        permission_classes = self.permission_classes.copy()
        
        # Add specific permissions based on action
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Add admin permission for modify actions
            from .permissions import ClientAdminPermission
            permission_classes.append(ClientAdminPermission)
        else:
            # Add scoped permission for read actions
            from .permissions import ClientScopedPermission
            permission_classes.append(ClientScopedPermission)
        
        return [permission() for permission in permission_classes]


class BillingViewSetMixin(ClientScopedMixin, AuditLoggingMixin):
    """
    Mixin for billing-related ViewSets with special billing permissions.
    """
    
    def get_permissions(self):
        """
        Add billing-specific permissions.
        """
        permission_classes = [permissions.IsAuthenticated]
        
        from .permissions import BillingAccessPermission
        permission_classes.append(BillingAccessPermission)
        
        return [permission() for permission in permission_classes]


class DocumentViewSetMixin(ClientScopedMixin, AuditLoggingMixin):
    """
    Mixin for document ViewSets with visibility-based permissions.
    """
    
    def get_permissions(self):
        """
        Add document-specific permissions.
        """
        permission_classes = [permissions.IsAuthenticated]
        
        from .permissions import DocumentVisibilityPermission
        permission_classes.append(DocumentVisibilityPermission)
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter documents based on visibility and user permissions.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # NOURX staff can see all documents
        if self._is_nourx_staff(user):
            return queryset
        
        # Filter out internal documents for non-staff users
        return queryset.exclude(visibility='internal')


class SupportViewSetMixin(ClientScopedMixin, AuditLoggingMixin):
    """
    Mixin for support ticket ViewSets with privacy settings.
    """
    
    def get_permissions(self):
        """
        Add support-specific permissions.
        """
        permission_classes = [permissions.IsAuthenticated]
        
        from .permissions import SupportTicketPermission
        permission_classes.append(SupportTicketPermission)
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter tickets based on privacy settings.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # NOURX staff can see all tickets
        if self._is_nourx_staff(user):
            return queryset
        
        # Filter out private tickets for non-staff users
        return queryset.filter(is_public=True)


class ReadOnlyViewSetMixin:
    """
    Mixin that restricts ViewSet to read-only operations.
    """
    
    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST')
    
    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT')
    
    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH')
    
    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE')
