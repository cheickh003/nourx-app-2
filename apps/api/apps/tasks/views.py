"""
Views for tasks app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from apps.clients.models import ClientMember
from apps.core.permissions import ClientScopedPermission, ClientAdminPermission
from .models import Task, TaskComment, TaskAttachment
from .serializers import (
    TaskListSerializer, TaskDetailSerializer, TaskCreateUpdateSerializer,
    TaskCommentSerializer, TaskCommentCreateSerializer, TaskAttachmentSerializer
)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks.
    """
    permission_classes = [ClientScopedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'task_type', 'assigned_to', 'project', 'milestone']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'order']
    ordering = ['order', '-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        else:
            return TaskDetailSerializer
    
    def get_queryset(self):
        """
        Return tasks filtered by user's project access.
        """
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()
        
        base_queryset = Task.objects.select_related(
            'project', 'project__client', 'assigned_to', 'created_by', 'milestone'
        ).prefetch_related('comments', 'attachments', 'subtasks')
        
        # NOURX staff can see all tasks
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin'):
            return base_queryset
        
        # Client users can only see tasks from their projects
        client_memberships = ClientMember.objects.filter(user=user)
        client_ids = [membership.client.id for membership in client_memberships]
        
        return base_queryset.filter(project__client__id__in=client_ids)
    
    def perform_create(self, serializer):
        """Create task with proper user assignment."""
        user = self.request.user
        serializer.save(created_by=user)
    
    def get_permissions(self):
        """Get permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [ClientAdminPermission]
        else:
            permission_classes = [ClientScopedPermission]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update task status with automatic date handling."""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status or new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {'error': 'Statut invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = task.status
        task.status = new_status
        
        # Auto-update dates based on status changes
        from django.utils import timezone
        
        if new_status == 'in_progress' and not task.started_at:
            task.started_at = timezone.now()
        elif new_status == 'done':
            if not task.completed_at:
                task.completed_at = timezone.now()
            task.progress = 100
        elif new_status in ['todo', 'blocked'] and old_status == 'in_progress':
            # Reset started_at if moving back from in_progress
            task.started_at = None
        
        task.save(update_fields=['status', 'started_at', 'completed_at', 'progress', 'updated_at'])
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update task progress."""
        task = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None or not isinstance(progress, int) or progress < 0 or progress > 100:
            return Response(
                {'error': 'La progression doit être un entier entre 0 et 100.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.progress = progress
        
        # Auto-complete task if progress reaches 100%
        if progress == 100 and task.status != 'done':
            task.status = 'done'
            from django.utils import timezone
            if not task.completed_at:
                task.completed_at = timezone.now()
        
        task.save(update_fields=['progress', 'status', 'completed_at', 'updated_at'])
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign task to a user."""
        task = self.get_object()
        assignee_id = request.data.get('assigned_to')
        
        if assignee_id:
            from django.contrib.auth.models import User
            try:
                assignee = User.objects.get(id=assignee_id)
                task.assigned_to = assignee
            except User.DoesNotExist:
                return Response(
                    {'error': 'Utilisateur introuvable.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            task.assigned_to = None
        
        task.save(update_fields=['assigned_to', 'updated_at'])
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or create comments for a task."""
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.all()
            
            # Filter internal comments for non-staff users
            user = request.user
            if not (user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin')):
                comments = comments.filter(is_internal=False)
            
            serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = TaskCommentCreateSerializer(data=request.data)
            if serializer.is_valid():
                # Check if user can create internal comments
                is_internal = serializer.validated_data.get('is_internal', False)
                user = request.user
                if is_internal and not (user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin')):
                    return Response(
                        {'error': 'Seuls les administrateurs peuvent créer des commentaires internes.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                serializer.save(task=task, author=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Get tasks organized for kanban view."""
        queryset = self.get_queryset()
        
        # Filter by project if specified
        project_id = request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by assigned user if specified
        assigned_to = request.query_params.get('assigned_to')
        if assigned_to:
            if assigned_to == 'me':
                queryset = queryset.filter(assigned_to=request.user)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Organize tasks by status
        kanban_data = {}
        for status_value, status_label in Task.STATUS_CHOICES:
            tasks = queryset.filter(status=status_value).order_by('order', '-created_at')
            kanban_data[status_value] = {
                'label': status_label,
                'tasks': TaskListSerializer(tasks, many=True, context={'request': request}).data
            }
        
        return Response(kanban_data)
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder task within its status column."""
        task = self.get_object()
        new_order = request.data.get('order')
        
        if new_order is None or not isinstance(new_order, int):
            return Response(
                {'error': 'L\'ordre doit être un entier.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.order = new_order
        task.save(update_fields=['order', 'updated_at'])
        
        return Response({'success': True})
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to the current user."""
        if not request.user.is_authenticated:
            return Response([])
        
        tasks = self.get_queryset().filter(assigned_to=request.user)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for tasks."""
        queryset = self.get_queryset()
        
        # If user is a client, show only their assigned tasks stats
        user = request.user
        if not (user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin')):
            queryset = queryset.filter(assigned_to=user)
        
        stats = {
            'total_tasks': queryset.count(),
            'my_tasks': queryset.filter(assigned_to=user).count() if user.is_authenticated else 0,
            'overdue_tasks': sum(1 for task in queryset if task.is_overdue),
            'tasks_by_status': {
                'todo': queryset.filter(status='todo').count(),
                'in_progress': queryset.filter(status='in_progress').count(),
                'review': queryset.filter(status='review').count(),
                'done': queryset.filter(status='done').count(),
                'blocked': queryset.filter(status='blocked').count(),
                'cancelled': queryset.filter(status='cancelled').count(),
            },
            'tasks_by_priority': {
                'low': queryset.filter(priority='low').count(),
                'normal': queryset.filter(priority='normal').count(),
                'high': queryset.filter(priority='high').count(),
                'urgent': queryset.filter(priority='urgent').count(),
            }
        }
        
        return Response(stats)


class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing task comments.
    """
    serializer_class = TaskCommentSerializer
    permission_classes = [ClientScopedPermission]
    
    def get_queryset(self):
        """Return comments filtered by user's task access."""
        user = self.request.user
        if not user.is_authenticated:
            return TaskComment.objects.none()
        
        base_queryset = TaskComment.objects.select_related('task', 'task__project', 'author')
        
        # NOURX staff can see all comments
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin'):
            return base_queryset
        
        # Client users can only see comments from their projects, excluding internal ones
        client_memberships = ClientMember.objects.filter(user=user)
        client_ids = [membership.client.id for membership in client_memberships]
        
        return base_queryset.filter(
            task__project__client__id__in=client_ids,
            is_internal=False
        )
    
    def perform_create(self, serializer):
        """Create comment with proper user assignment."""
        user = self.request.user
        
        # Check if user can create internal comments
        is_internal = serializer.validated_data.get('is_internal', False)
        if is_internal and not (user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'admin')):
            raise PermissionError('Seuls les administrateurs peuvent créer des commentaires internes.')
        
        serializer.save(author=user)
