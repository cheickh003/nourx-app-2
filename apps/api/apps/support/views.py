"""
Views for support app.
"""
from rest_framework import viewsets, filters, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
 

from apps.core.permissions import IsAdminUser
from apps.clients.models import ClientMember
from .models import Ticket
from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketMessageSerializer, TicketMessageCreateSerializer
)

User = get_user_model()

class TicketViewSet(viewsets.ModelViewSet):
    """ViewSet for support tickets with admin management capabilities."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "priority", "project", "client", "assigned_to"]
    search_fields = ["ticket_number", "subject"]
    ordering = ["-created_at"]

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        if request.method == 'POST':
            serializer = TicketMessageCreateSerializer(data=request.data)
            if serializer.is_valid():
                msg = serializer.save(ticket=ticket, author=request.user)
                full = TicketMessageSerializer(msg)
                return Response(full.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        comments = ticket.messages.all().order_by('created_at').prefetch_related('attachments')
        user = request.user
        if not (user.is_staff or (hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'admin')):
            comments = comments.filter(is_internal=False)
        serializer = TicketMessageSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def attachments(self, request, pk=None):
        """Upload an attachment for this ticket. Accepts multipart with 'file' and optional 'message_id'."""
        ticket = self.get_object()
        user = request.user
        # Permission: staff/admin or a user from the same client
        if not (user.is_staff or (hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'admin')):
            from apps.clients.models import ClientMember
            if not ClientMember.objects.filter(user=user, client=ticket.client).exists():
                return Response({'detail': "Vous n'avez pas les permissions pour effectuer cette action."}, status=status.HTTP_403_FORBIDDEN)

        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)
        # Validate size and type
        from django.conf import settings
        max_size = getattr(settings, 'SUPPORT_ATTACHMENT_MAX_SIZE', 20 * 1024 * 1024)
        allowed = set(getattr(settings, 'SUPPORT_ALLOWED_MIME_TYPES', []))
        mime = getattr(uploaded, 'content_type', '') or 'application/octet-stream'
        size = getattr(uploaded, 'size', 0)
        if size and size > max_size:
            return Response({'detail': f'Fichier trop volumineux (max {(max_size // (1024*1024))}MB).'}, status=status.HTTP_400_BAD_REQUEST)
        if allowed and mime not in allowed:
            return Response({'detail': f'Type de fichier non autorisé ({mime}).'}, status=status.HTTP_400_BAD_REQUEST)
        message_id = request.data.get('message_id')
        from .models import TicketAttachment, TicketMessage
        attach_kwargs = {
            'ticket': ticket,
            'uploaded_by': user,
            'file': uploaded,
            'file_name': getattr(uploaded, 'name', ''),
            'file_size': getattr(uploaded, 'size', 0),
            'mime_type': getattr(uploaded, 'content_type', 'application/octet-stream'),
        }
        if message_id:
            try:
                msg = TicketMessage.objects.get(id=message_id, ticket=ticket)
                attach_kwargs['message'] = msg
            except TicketMessage.DoesNotExist:
                return Response({'detail': 'Message introuvable pour ce ticket.'}, status=status.HTTP_404_NOT_FOUND)

        att = TicketAttachment.objects.create(**attach_kwargs)
        url = att.file.url  # Force S3 URL generation; misconfig will raise
        return Response({
            'id': str(att.id),
            'file_name': att.file_name,
            'file_size': att.file_size,
            'mime_type': att.mime_type,
            'url': url,
            'message_id': str(att.message.id) if att.message_id else None,
        }, status=status.HTTP_201_CREATED)


    def get_queryset(self):
        qs = Ticket.objects.select_related("project", "assigned_to", "client", "reporter")
        user = self.request.user
        if not user.is_authenticated:
            return Ticket.objects.none()
        if user.is_staff or (hasattr(user, "profile") and user.profile.role == "admin"):
            return qs
        client_ids = list(ClientMember.objects.filter(user=user).values_list("client_id", flat=True))
        return qs.filter(client__id__in=client_ids)

    def get_serializer_class(self):
        if self.action == "list":
            return TicketListSerializer
        if self.action == "create":
            return TicketCreateSerializer
        return TicketDetailSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'assign', 'update_status']:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        membership = ClientMember.objects.filter(user=user).first()
        if not membership:
            # Auto-provision a client and membership for new client users
            from apps.clients.models import Client, ClientMember as CM
            from apps.core.models import Profile
            # Ensure profile exists and is 'client'
            profile = getattr(user, 'profile', None)
            if profile is None:
                Profile.objects.create(user=user, role='client')
            elif getattr(profile, 'role', None) is None:
                profile.role = 'client'
                profile.save(update_fields=['role'])

            display_name = (user.get_full_name() or user.username).strip() or (user.email or 'Client')
            contact_email = user.email or f"{user.username}@example.com"

            client = Client.objects.create(
                name=f"Compte {display_name}",
                email=contact_email,
                main_contact_name=display_name,
                main_contact_email=contact_email,
                status='active',
            )
            membership = CM.objects.create(user=user, client=client)
        serializer.save(client=membership.client, reporter=user)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        assignee_id = request.data.get('assignee_id')
        if not assignee_id:
            return Response({'error': 'assignee_id manquant'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            assignee = User.objects.get(id=assignee_id)
            ticket.assigned_to = assignee
            ticket.save()
            return Response(TicketDetailSerializer(ticket).data)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if not new_status or new_status not in [choice[0] for choice in Ticket.STATUS_CHOICES]:
            return Response({'error': 'Statut invalide'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = new_status
        ticket.save()
        return Response(TicketDetailSerializer(ticket).data)


 
