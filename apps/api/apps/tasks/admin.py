"""
Admin configuration for tasks app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Task, TaskComment, TaskAttachment


class TaskCommentInline(admin.TabularInline):
    """
    Inline for managing task comments.
    """
    model = TaskComment
    extra = 0
    fields = ['author', 'body', 'is_internal']
    readonly_fields = ['created_at']


class TaskAttachmentInline(admin.TabularInline):
    """
    Inline for managing task attachments.
    """
    model = TaskAttachment
    extra = 0
    fields = ['file_name', 'file_size', 'mime_type', 'uploaded_by']
    readonly_fields = ['file_size', 'mime_type', 'uploaded_by', 'created_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Admin interface for Task model.
    """
    list_display = [
        'title', 'project', 'status_display', 'priority_display', 
        'assigned_to', 'progress_display', 'due_date', 'is_overdue_display'
    ]
    list_filter = [
        'status', 'priority', 'task_type', 'due_date', 
        'project__client', 'assigned_to', 'created_at'
    ]
    search_fields = [
        'title', 'description', 'project__title', 
        'assigned_to__username', 'assigned_to__first_name', 'assigned_to__last_name'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'description', 'project', 'milestone', 'parent_task')
        }),
        ('Classification', {
            'fields': ('status', 'priority', 'task_type', 'tags')
        }),
        ('Assignation', {
            'fields': ('assigned_to', 'created_by')
        }),
        ('Dates', {
            'fields': ('due_date', 'started_at', 'completed_at')
        }),
        ('Temps et progression', {
            'fields': ('estimated_hours', 'actual_hours', 'progress', 'order')
        }),
    )
    
    autocomplete_fields = ['project', 'milestone', 'assigned_to', 'created_by', 'parent_task']
    readonly_fields = ['created_at', 'updated_at', 'started_at', 'completed_at']
    inlines = [TaskCommentInline, TaskAttachmentInline]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'todo': '#6c757d',
            'in_progress': '#007bff',
            'review': '#ffc107',
            'done': '#28a745',
            'blocked': '#dc3545',
            'cancelled': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def priority_display(self, obj):
        """Display priority with color coding."""
        colors = {
            'low': '#28a745',
            'normal': '#007bff',
            'high': '#fd7e14',
            'urgent': '#dc3545'
        }
        color = colors.get(obj.priority, '#007bff')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_display.short_description = 'Priorité'
    
    def progress_display(self, obj):
        """Display progress as a colored bar."""
        if obj.progress <= 25:
            color = '#dc3545'  # Red
        elif obj.progress <= 50:
            color = '#fd7e14'  # Orange
        elif obj.progress <= 75:
            color = '#ffc107'  # Yellow
        else:
            color = '#28a745'  # Green
            
        return format_html(
            '<div style="width: 80px; background-color: #e9ecef;">'
            '<div style="width: {}px; height: 16px; background-color: {}; text-align: center; color: white; font-size: 11px; line-height: 16px;">'
            '{}%</div></div>',
            int(obj.progress * 0.8), color, obj.progress
        )
    progress_display.short_description = 'Progression'
    
    def is_overdue_display(self, obj):
        """Display overdue status with color."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">⚠️ En retard</span>'
            )
        return format_html(
            '<span style="color: #28a745;">✅ Dans les temps</span>'
        )
    is_overdue_display.short_description = 'État'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'project', 'project__client', 'assigned_to', 'created_by', 'milestone'
        )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    """
    Admin interface for TaskComment model.
    """
    list_display = ['task', 'author', 'body_preview', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at', 'task__project']
    search_fields = ['body', 'task__title', 'author__username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('task', 'author', 'body')
        }),
        ('Paramètres', {
            'fields': ('is_internal', 'attachment')
        }),
    )
    
    autocomplete_fields = ['task', 'author']
    readonly_fields = ['created_at', 'updated_at']
    
    def body_preview(self, obj):
        """Display a preview of the comment body."""
        if len(obj.body) > 50:
            return f"{obj.body[:50]}..."
        return obj.body
    body_preview.short_description = 'Commentaire'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('task', 'author')


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    """
    Admin interface for TaskAttachment model.
    """
    list_display = ['file_name', 'task', 'file_size_display', 'mime_type', 'uploaded_by', 'created_at']
    list_filter = ['mime_type', 'created_at', 'task__project']
    search_fields = ['file_name', 'task__title', 'uploaded_by__username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Fichier', {
            'fields': ('file', 'file_name')
        }),
        ('Métadonnées', {
            'fields': ('task', 'uploaded_by', 'file_size', 'mime_type')
        }),
    )
    
    autocomplete_fields = ['task', 'uploaded_by']
    readonly_fields = ['file_size', 'mime_type', 'created_at', 'updated_at']
    
    def file_size_display(self, obj):
        """Display file size in human readable format."""
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        elif obj.file_size < 1024 * 1024 * 1024:
            return f"{obj.file_size / (1024 * 1024):.1f} MB"
        else:
            return f"{obj.file_size / (1024 * 1024 * 1024):.1f} GB"
    file_size_display.short_description = 'Taille'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('task', 'uploaded_by')
