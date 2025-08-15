"""
Admin configuration for documents app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Document, DocumentFolder, DocumentAccess


@admin.register(DocumentFolder)
class DocumentFolderAdmin(admin.ModelAdmin):
    """
    Admin interface for DocumentFolder model.
    """
    list_display = ['name', 'project', 'parent', 'order', 'created_at']
    list_filter = ['project', 'created_at']
    search_fields = ['name', 'description', 'project__title']
    ordering = ['project', 'order', 'name']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'description', 'project', 'parent')
        }),
        ('Organisation', {
            'fields': ('order',)
        }),
    )
    
    autocomplete_fields = ['project', 'parent']
    readonly_fields = ['created_at', 'updated_at']


class DocumentAccessInline(admin.TabularInline):
    """
    Inline for document access logs.
    """
    model = DocumentAccess
    extra = 0
    fields = ['user', 'action', 'ip_address', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """
    Admin interface for Document model.
    """
    list_display = [
        'title', 'project', 'folder', 'visibility_display', 'version_status_display',
        'file_size_display', 'mime_type', 'download_count', 'uploaded_by', 'created_at'
    ]
    list_filter = [
        'visibility', 'version_status', 'mime_type', 'project', 'created_at'
    ]
    search_fields = [
        'title', 'description', 'file_name', 'project__title', 'tags'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'description', 'project', 'folder', 'uploaded_by')
        }),
        ('Fichier', {
            'fields': ('file', 'file_name', 'file_size', 'mime_type')
        }),
        ('Stockage S3', {
            'fields': ('s3_bucket', 's3_key'),
            'classes': ('collapse',)
        }),
        ('Visibilité et version', {
            'fields': ('visibility', 'version', 'version_status', 'previous_version')
        }),
        ('Métadonnées', {
            'fields': ('tags',)
        }),
        ('Statistiques', {
            'fields': ('download_count', 'last_downloaded_at'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['project', 'folder', 'uploaded_by', 'previous_version']
    readonly_fields = [
        'file_size', 'mime_type', 'download_count', 
        'last_downloaded_at', 'created_at', 'updated_at'
    ]
    inlines = [DocumentAccessInline]
    
    def visibility_display(self, obj):
        """Display visibility with color coding."""
        colors = {
            'public': '#28a745',
            'internal': '#fd7e14',
            'restricted': '#dc3545'
        }
        icons = {
            'public': '👁️',
            'internal': '🏢',
            'restricted': '🔒'
        }
        color = colors.get(obj.visibility, '#6c757d')
        icon = icons.get(obj.visibility, '📄')
        return format_html(
            '{} <span style="color: {}; font-weight: bold;">{}</span>',
            icon, color, obj.get_visibility_display()
        )
    visibility_display.short_description = 'Visibilité'
    
    def version_status_display(self, obj):
        """Display version status with color coding."""
        colors = {
            'draft': '#6c757d',
            'review': '#ffc107',
            'approved': '#28a745',
            'archived': '#6c757d'
        }
        color = colors.get(obj.version_status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_version_status_display()
        )
    version_status_display.short_description = 'Statut version'
    
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
        return super().get_queryset(request).select_related(
            'project', 'folder', 'uploaded_by'
        )


@admin.register(DocumentAccess)
class DocumentAccessAdmin(admin.ModelAdmin):
    """
    Admin interface for DocumentAccess model.
    """
    list_display = [
        'document', 'user', 'action_display', 'ip_address', 'created_at'
    ]
    list_filter = ['action', 'created_at', 'document__project']
    search_fields = [
        'document__title', 'user__username', 'user__email', 'ip_address'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Accès', {
            'fields': ('document', 'user', 'action')
        }),
        ('Métadonnées techniques', {
            'fields': ('ip_address', 'user_agent')
        }),
    )
    
    autocomplete_fields = ['document', 'user']
    readonly_fields = ['created_at', 'updated_at']
    
    def action_display(self, obj):
        """Display action with icon."""
        icons = {
            'view': '👁️',
            'download': '⬇️',
            'share': '🔗',
            'delete': '🗑️'
        }
        icon = icons.get(obj.action, '📄')
        return format_html(
            '{} {}',
            icon, obj.get_action_display()
        )
    action_display.short_description = 'Action'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'document', 'user', 'document__project'
        )
