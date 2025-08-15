"""
Admin configuration for audit app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import json
from .models import AuditLog, AuditLogArchive


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for AuditLog model.
    """
    list_display = [
        'created_at', 'actor', 'action_display', 'description', 
        'content_object_display', 'client', 'level_display', 'ip_address'
    ]
    list_filter = [
        'action', 'level', 'content_type', 'client', 'project', 'created_at'
    ]
    search_fields = [
        'description', 'actor__username', 'actor__email', 
        'client__name', 'project__title', 'ip_address'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Action', {
            'fields': ('actor', 'action', 'description', 'level')
        }),
        ('Objet concerné', {
            'fields': ('content_type', 'object_id', 'content_object')
        }),
        ('Contexte métier', {
            'fields': ('client', 'project')
        }),
        ('Données de changement', {
            'fields': ('old_values_display', 'new_values_display'),
            'classes': ('collapse',)
        }),
        ('Métadonnées techniques', {
            'fields': ('ip_address', 'user_agent', 'session_key', 'batch_id'),
            'classes': ('collapse',)
        }),
        ('Données supplémentaires', {
            'fields': ('extra_data_display',),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['actor', 'client', 'project']
    readonly_fields = [
        'content_object', 'old_values_display', 'new_values_display',
        'extra_data_display', 'created_at', 'updated_at'
    ]
    
    # Prevent adding/editing/deleting audit logs through admin
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def action_display(self, obj):
        """Display action with icon."""
        icons = {
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'login': '🔓',
            'logout': '🔒',
            'view': '👁️',
            'download': '⬇️',
            'export': '📤',
            'import': '📥',
            'send': '📧',
            'approve': '✅',
            'reject': '❌',
            'archive': '📦',
            'restore': '🔄',
            'payment': '💳',
            'refund': '💸',
            'other': '🔧'
        }
        icon = icons.get(obj.action, '🔧')
        return format_html(
            '{} {}',
            icon, obj.get_action_display()
        )
    action_display.short_description = 'Action'
    
    def level_display(self, obj):
        """Display level with color coding."""
        colors = {
            'info': '#007bff',
            'warning': '#ffc107',
            'error': '#dc3545',
            'critical': '#dc3545'
        }
        icons = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌',
            'critical': '🚨'
        }
        color = colors.get(obj.level, '#007bff')
        icon = icons.get(obj.level, 'ℹ️')
        return format_html(
            '{} <span style="color: {}; font-weight: bold;">{}</span>',
            icon, color, obj.get_level_display()
        )
    level_display.short_description = 'Niveau'
    
    def content_object_display(self, obj):
        """Display the related object if it exists."""
        if obj.content_object:
            return format_html(
                '<strong>{}</strong>: {}',
                obj.content_type.model.title(),
                str(obj.content_object)
            )
        return '-'
    content_object_display.short_description = 'Objet'
    
    def old_values_display(self, obj):
        """Display formatted old values."""
        if obj.old_values:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll; background: #f8f9fa; padding: 10px;">{}</pre>',
                json.dumps(obj.old_values, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    old_values_display.short_description = 'Valeurs avant'
    
    def new_values_display(self, obj):
        """Display formatted new values."""
        if obj.new_values:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll; background: #f8f9fa; padding: 10px;">{}</pre>',
                json.dumps(obj.new_values, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    new_values_display.short_description = 'Nouvelles valeurs'
    
    def extra_data_display(self, obj):
        """Display formatted extra data."""
        if obj.extra_data:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll; background: #f8f9fa; padding: 10px;">{}</pre>',
                json.dumps(obj.extra_data, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    extra_data_display.short_description = 'Données supplémentaires'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'actor', 'content_type', 'client', 'project'
        )


@admin.register(AuditLogArchive)
class AuditLogArchiveAdmin(admin.ModelAdmin):
    """
    Admin interface for AuditLogArchive model.
    """
    list_display = [
        'archive_date', 'logs_count', 'from_date', 'to_date', 
        'compression_ratio_display', 'created_at'
    ]
    list_filter = ['archive_date', 'created_at']
    search_fields = ['checksum']
    ordering = ['-created_at']
    date_hierarchy = 'archive_date'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('archive_date', 'logs_count', 'from_date', 'to_date')
        }),
        ('Compression', {
            'fields': ('compressed_data_size_display', 'compression_ratio', 'checksum')
        }),
    )
    
    readonly_fields = [
        'logs_count', 'compressed_data_size_display', 'compression_ratio', 
        'checksum', 'created_at', 'updated_at'
    ]
    
    def compression_ratio_display(self, obj):
        """Display compression ratio as percentage."""
        if obj.compression_ratio:
            return format_html(
                '<strong>{:.1%}</strong>',
                obj.compression_ratio
            )
        return '-'
    compression_ratio_display.short_description = 'Ratio de compression'
    
    def compressed_data_size_display(self, obj):
        """Display compressed data size in human readable format."""
        if obj.compressed_data:
            size = len(obj.compressed_data)
            if size < 1024:
                return f"{size} B"
            elif size < 1024 * 1024:
                return f"{size / 1024:.1f} KB"
            elif size < 1024 * 1024 * 1024:
                return f"{size / (1024 * 1024):.1f} MB"
            else:
                return f"{size / (1024 * 1024 * 1024):.1f} GB"
        return '-'
    compressed_data_size_display.short_description = 'Taille compressée'
