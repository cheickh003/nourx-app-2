"""
Serializers for tasks app.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, TaskComment, TaskAttachment
from apps.core.serializers import UserProfileSerializer


class TaskAssigneeSerializer(serializers.ModelSerializer):
    """
    Serializer for task assignee.
    """
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for task attachments.
    """
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskAttachment
        fields = [
            "id", "file_name", "file_size", "mime_type", "file_url",
            "uploaded_by_name", "created_at"
        ]
        read_only_fields = ["id", "created_at", "uploaded_by_name", "file_url"]
    
    def get_uploaded_by_name(self, obj):
        """Get uploader name."""
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
    
    def get_file_url(self, obj):
        """Get file download URL."""
        if obj.file:
            return obj.file.url
        return None


class TaskCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for task comments.
    """
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskComment
        fields = [
            "id", "body", "attachment_url", "is_internal",
            "author_name", "author_avatar", "can_edit",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "author_name", "author_avatar", "can_edit"]
    
    def get_author_name(self, obj):
        """Get author display name."""
        return obj.author.get_full_name() or obj.author.username
    
    def get_author_avatar(self, obj):
        """Get author avatar URL."""
        if hasattr(obj.author, 'profile') and obj.author.profile.avatar:
            return obj.author.profile.avatar.url
        return None
    
    def get_attachment_url(self, obj):
        """Get attachment URL."""
        if obj.attachment:
            return obj.attachment.url
        return None
    
    def get_can_edit(self, obj):
        """Check if current user can edit this comment."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Author can edit their own comments
        if obj.author == request.user:
            return True
        
        # NOURX staff can edit any comment
        if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return True
        
        return False


class TaskListSerializer(serializers.ModelSerializer):
    """
    Serializer for task list view (lightweight).
    """
    assigned_to = TaskAssigneeSerializer(read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    client_name = serializers.CharField(source="project.client.name", read_only=True)
    is_overdue = serializers.ReadOnlyField()
    tag_list = serializers.ReadOnlyField()
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            "id", "title", "status", "priority", "task_type", "progress",
            "due_date", "is_overdue", "assigned_to", "project_title", 
            "client_name", "tag_list", "comment_count", "attachment_count",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue", "tag_list"]
    
    def get_comment_count(self, obj):
        """Get number of comments."""
        request = self.context.get('request')
        if not request:
            return obj.comments.count()
        
        # Filter internal comments for non-staff users
        if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return obj.comments.count()
        else:
            return obj.comments.filter(is_internal=False).count()
    
    def get_attachment_count(self, obj):
        """Get number of attachments."""
        return obj.attachments.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for task detail view (full information).
    """
    assigned_to = TaskAssigneeSerializer(read_only=True)
    created_by = TaskAssigneeSerializer(read_only=True)
    project = serializers.SerializerMethodField()
    milestone = serializers.SerializerMethodField()
    parent_task = serializers.SerializerMethodField()
    subtasks = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    tag_list = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority", "task_type",
            "progress", "due_date", "started_at", "completed_at", "is_overdue",
            "estimated_hours", "actual_hours", "order", "tags", "tag_list",
            "assigned_to", "created_by", "project", "milestone", "parent_task",
            "subtasks", "comments", "attachments", "can_edit",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "is_overdue", "tag_list", 
            "can_edit", "created_by"
        ]
    
    def get_project(self, obj):
        """Get project information."""
        return {
            "id": obj.project.id,
            "title": obj.project.title,
            "status": obj.project.status,
            "client_name": obj.project.client.name
        }
    
    def get_milestone(self, obj):
        """Get milestone information."""
        if obj.milestone:
            return {
                "id": obj.milestone.id,
                "title": obj.milestone.title,
                "due_date": obj.milestone.due_date,
                "status": obj.milestone.status
            }
        return None
    
    def get_parent_task(self, obj):
        """Get parent task information."""
        if obj.parent_task:
            return {
                "id": obj.parent_task.id,
                "title": obj.parent_task.title,
                "status": obj.parent_task.status
            }
        return None
    
    def get_subtasks(self, obj):
        """Get subtasks information."""
        subtasks = obj.subtasks.all()
        return [{
            "id": subtask.id,
            "title": subtask.title,
            "status": subtask.status,
            "progress": subtask.progress,
            "assigned_to": subtask.assigned_to.get_full_name() if subtask.assigned_to else None
        } for subtask in subtasks]
    
    def get_can_edit(self, obj):
        """Check if current user can edit this task."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # NOURX staff can edit any task
        if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return True
        
        # Assigned user can edit their task
        if obj.assigned_to == request.user:
            return True
        
        # Project manager can edit tasks in their project
        if obj.project.project_manager == request.user:
            return True
        
        # Client members with admin role can edit
        from apps.clients.models import ClientMember
        try:
            membership = ClientMember.objects.get(user=request.user, client=obj.project.client)
            return membership.role in ['owner', 'admin']
        except ClientMember.DoesNotExist:
            pass
        
        return False
    
    def to_representation(self, instance):
        """Filter comments based on user permissions."""
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Filter internal comments for non-staff users
            if not (request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')):
                ret['comments'] = [
                    comment for comment in ret['comments'] 
                    if not comment.get('is_internal', False)
                ]
        
        return ret


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating tasks.
    """
    class Meta:
        model = Task
        fields = [
            "title", "description", "status", "priority", "task_type",
            "progress", "due_date", "estimated_hours", "tags",
            "assigned_to", "milestone", "parent_task", "order"
        ]
    
    def validate(self, attrs):
        """Validate task data."""
        progress = attrs.get("progress", 0)
        if progress < 0 or progress > 100:
            raise serializers.ValidationError(
                "La progression doit être entre 0 et 100."
            )
        
        # Auto-update dates based on status
        status = attrs.get("status")
        if status == "in_progress" and not attrs.get("started_at"):
            from django.utils import timezone
            attrs["started_at"] = timezone.now()
        elif status == "done" and not attrs.get("completed_at"):
            from django.utils import timezone
            attrs["completed_at"] = timezone.now()
            attrs["progress"] = 100
        elif status in ["todo", "blocked"] and attrs.get("started_at"):
            # Reset started_at if moving back to todo or blocked
            attrs["started_at"] = None
        
        return attrs


class TaskCommentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating task comments.
    """
    class Meta:
        model = TaskComment
        fields = ["body", "is_internal", "attachment"]
    
    def validate(self, attrs):
        """Validate comment data."""
        if not attrs.get("body", "").strip():
            raise serializers.ValidationError(
                "Le commentaire ne peut pas être vide."
            )
        return attrs
