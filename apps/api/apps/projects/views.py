"""
Views for projects app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from apps.clients.models import ClientMember
from apps.core.permissions import ClientScopedPermission, ClientAdminPermission
from .models import Project, Milestone
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateUpdateSerializer,
    MilestoneSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects.
    """
    permission_classes = [ClientScopedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'client']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'progress']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        else:
            return ProjectDetailSerializer
    
    def get_queryset(self):
        """
        Return projects filtered by user's client access.
        """
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()
        
        # NOURX staff can see all projects
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin'):
            return Project.objects.select_related('client', 'project_manager').prefetch_related(
                'team_members', 'milestones', 'tasks'
            )
        
        # Client users can only see their projects
        client_memberships = ClientMember.objects.filter(user=user)
        client_ids = [membership.client.id for membership in client_memberships]
        
        return Project.objects.filter(
            client__id__in=client_ids
        ).select_related('client', 'project_manager').prefetch_related(
            'team_members', 'milestones', 'tasks'
        )

    def create(self, request, *args, **kwargs):
        user = request.user
        client_id = request.data.get('client')

        if not client_id:
            return Response({"detail": "Client is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_staff and not (hasattr(user, 'profile') and user.profile.role == 'admin'):
            if not ClientMember.objects.filter(user=user, client_id=client_id).exists():
                return Response({"detail": "You do not have permission to create a project for this client."}, status=status.HTTP_403_FORBIDDEN)

        return super().create(request, *args, **kwargs)
    
    def get_permissions(self):
        """Get permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [ClientAdminPermission]
        else:
            permission_classes = [ClientScopedPermission]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get tasks for a specific project."""
        project = self.get_object()
        from apps.tasks.models import Task
        from apps.tasks.serializers import TaskListSerializer
        
        tasks = Task.objects.filter(project=project).select_related(
            'assigned_to', 'created_by'
        ).prefetch_related('comments', 'attachments')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        # Filter by assigned user if provided
        assigned_to = request.query_params.get('assigned_to')
        if assigned_to:
            tasks = tasks.filter(assigned_to_id=assigned_to)
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def milestones(self, request, pk=None):
        """Get milestones for a specific project."""
        project = self.get_object()
        milestones = project.milestones.all()
        serializer = MilestoneSerializer(milestones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update project progress."""
        project = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None or not isinstance(progress, int) or progress < 0 or progress > 100:
            return Response(
                {'error': 'La progression doit être un entier entre 0 et 100.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.progress = progress
        project.save(update_fields=['progress', 'updated_at'])
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for projects."""
        queryset = self.get_queryset()
        
        stats = {
            'total_projects': queryset.count(),
            'active_projects': queryset.filter(status='active').count(),
            'completed_projects': queryset.filter(status='completed').count(),
            'overdue_projects': sum(1 for project in queryset if project.is_overdue),
            'projects_by_status': {
                'draft': queryset.filter(status='draft').count(),
                'active': queryset.filter(status='active').count(),
                'on_hold': queryset.filter(status='on_hold').count(),
                'completed': queryset.filter(status='completed').count(),
                'cancelled': queryset.filter(status='cancelled').count(),
            },
            'projects_by_priority': {
                'low': queryset.filter(priority='low').count(),
                'normal': queryset.filter(priority='normal').count(),
                'high': queryset.filter(priority='high').count(),
                'urgent': queryset.filter(priority='urgent').count(),
            }
        }
        
        return Response(stats)


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project milestones.
    """
    serializer_class = MilestoneSerializer
    permission_classes = [ClientScopedPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'project']
    ordering_fields = ['due_date', 'order', 'created_at']
    ordering = ['order', 'due_date']
    
    def get_queryset(self):
        """Return milestones filtered by user's project access."""
        user = self.request.user
        if not user.is_authenticated:
            return Milestone.objects.none()
        
        # NOURX staff can see all milestones
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin'):
            return Milestone.objects.select_related('project', 'project__client')
        
        # Client users can only see milestones from their projects
        client_memberships = ClientMember.objects.filter(user=user)
        client_ids = [membership.client.id for membership in client_memberships]
        
        return Milestone.objects.filter(
            project__client__id__in=client_ids
        ).select_related('project', 'project__client')
    
    def get_permissions(self):
        """Get permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [ClientAdminPermission]
        else:
            permission_classes = [ClientScopedPermission]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update milestone progress."""
        milestone = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None or not isinstance(progress, int) or progress < 0 or progress > 100:
            return Response(
                {'error': 'La progression doit être un entier entre 0 et 100.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        milestone.progress = progress
        
        # Auto-complete milestone if progress reaches 100%
        if progress == 100 and milestone.status != 'completed':
            milestone.status = 'completed'
            from django.utils import timezone
            milestone.completed_at = timezone.now()
        
        milestone.save(update_fields=['progress', 'status', 'completed_at', 'updated_at'])
        
        serializer = self.get_serializer(milestone)
        return Response(serializer.data)
