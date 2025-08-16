"""
Serializers for projects app.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Milestone
from apps.core.serializers import UserProfileSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for project team members.
    """
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class MilestoneSerializer(serializers.ModelSerializer):
    """
    Serializer for project milestones.
    """
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Milestone
        fields = [
            "id", "title", "description", "status", "due_date", 
            "completed_at", "order", "progress", "is_overdue",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue"]


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer for project list view (lightweight).
    """
    client_name = serializers.CharField(source="client.name", read_only=True)
    project_manager_name = serializers.SerializerMethodField()
    team_size = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    task_counts = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            "id", "title", "status", "priority", "progress", "start_date", 
            "end_date", "is_overdue", "client_name", "project_manager_name",
            "team_size", "task_counts", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue"]
    
    def get_project_manager_name(self, obj):
        """Get project manager display name."""
        if obj.project_manager:
            return obj.project_manager.get_full_name() or obj.project_manager.username
        return None
    
    def get_team_size(self, obj):
        """Get number of team members."""
        return obj.team_members.count()
    
    def get_task_counts(self, obj):
        """Get task counts by status."""
        from apps.tasks.models import Task
        task_counts = {
            "total": obj.tasks.count(),
            "todo": obj.tasks.filter(status="todo").count(),
            "in_progress": obj.tasks.filter(status="in_progress").count(),
            "review": obj.tasks.filter(status="review").count(),
            "done": obj.tasks.filter(status="done").count(),
            "blocked": obj.tasks.filter(status="blocked").count(),
        }
        return task_counts


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for project detail view (full information).
    """
    client = serializers.SerializerMethodField()
    project_manager = ProjectMemberSerializer(read_only=True)
    team_members = ProjectMemberSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    task_counts = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            "id", "title", "description", "status", "priority", "progress", 
            "start_date", "end_date", "completed_at", "is_overdue",
            "estimated_hours", "actual_hours", "notes",
            "client", "project_manager", "team_members", "milestones",
            "task_counts", "recent_activity", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue"]
    
    def get_client(self, obj):
        """Get client information."""
        return {
            "id": obj.client.id,
            "name": obj.client.name,
            "email": obj.client.email,
            "status": obj.client.status
        }
    
    def get_task_counts(self, obj):
        """Get detailed task counts."""
        from apps.tasks.models import Task
        return {
            "total": obj.tasks.count(),
            "todo": obj.tasks.filter(status="todo").count(),
            "in_progress": obj.tasks.filter(status="in_progress").count(),
            "review": obj.tasks.filter(status="review").count(),
            "done": obj.tasks.filter(status="done").count(),
            "blocked": obj.tasks.filter(status="blocked").count(),
            "cancelled": obj.tasks.filter(status="cancelled").count(),
        }
    
    def get_recent_activity(self, obj):
        """Get recent activity for this project."""
        from apps.tasks.models import Task, TaskComment
        from django.utils import timezone
        from datetime import timedelta
        
        # Get activities from last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        
        activities = []
        
        # Recent tasks
        recent_tasks = Task.objects.filter(
            project=obj, 
            updated_at__gte=week_ago
        ).select_related('assigned_to')[:5]
        
        for task in recent_tasks:
            activities.append({
                "type": "task_update",
                "timestamp": task.updated_at,
                "description": f"Tâche '{task.title}' mise à jour",
                "user": task.assigned_to.get_full_name() if task.assigned_to else None,
                "task_id": task.id
            })
        
        # Recent comments
        recent_comments = TaskComment.objects.filter(
            task__project=obj,
            created_at__gte=week_ago,
            is_internal=False
        ).select_related('author', 'task')[:5]
        
        for comment in recent_comments:
            activities.append({
                "type": "task_comment",
                "timestamp": comment.created_at,
                "description": f"Commentaire sur '{comment.task.title}'",
                "user": comment.author.get_full_name() or comment.author.username,
                "task_id": comment.task.id
            })
        
        # Sort by timestamp and return last 10
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:10]


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating projects.
    """
    class Meta:
        model = Project
        fields = [
            "client", "title", "description", "status", "priority", "progress",
            "start_date", "end_date", "estimated_hours", "notes",
            "project_manager", "team_members"
        ]
    
    def validate(self, attrs):
        """Validate project data."""
        if attrs.get("start_date") and attrs.get("end_date"):
            if attrs["start_date"] > attrs["end_date"]:
                raise serializers.ValidationError(
                    "La date de début ne peut pas être postérieure à la date de fin."
                )
        
        progress = attrs.get("progress", 0)
        if progress < 0 or progress > 100:
            raise serializers.ValidationError(
                "La progression doit être entre 0 et 100."
            )
        
        return attrs
