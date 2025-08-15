"""
Admin configuration for support app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Ticket, TicketCategory, TicketMessage, TicketAttachment


@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for TicketCategory model.
    """
    list_display = ['name', 'color_display', 'is_active', 'order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Apparence', {
            'fields': ('color', 'order')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def color_display(self, obj):
        """Display color with preview."""
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; display: inline-block; margin-right: 5px;"></div>{}',
            obj.color, obj.color
        )
    color_display.short_description = 'Couleur'


class TicketMessageInline(admin.StackedInline):
    """
    Inline for ticket messages.
    """
    model = TicketMessage
    extra = 0
    fields = ['message_type', 'content', 'author', 'is_internal']
    readonly_fields = ['created_at']


class TicketAttachmentInline(admin.TabularInline):
    """
    Inline for ticket attachments.
    """
    model = TicketAttachment
    extra = 0
    fields = ['file_name', 'file_size', 'mime_type', 'uploaded_by']
    readonly_fields = ['file_size', 'mime_type', 'uploaded_by', 'created_at']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """
    Admin interface for Ticket model.
    """
    list_display = [
        'ticket_number', 'subject', 'client', 'status_display', 'priority_display',
        'assigned_to', 'due_date', 'is_overdue_display', 'satisfaction_rating_display'
    ]
    list_filter = [
        'status', 'priority', 'source', 'category', 'assigned_to', 
        'is_public', 'created_at', 'due_date'
    ]
    search_fields = [
        'ticket_number', 'subject', 'description', 'client__name',
        'reporter__username', 'reporter__email'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('ticket_number', 'subject', 'description', 'client', 'project', 'category')
        }),
        ('Personnes impliquées', {
            'fields': ('reporter', 'assigned_to')
        }),
        ('Classification', {
            'fields': ('status', 'priority', 'source', 'tags', 'is_public')
        }),
        ('Dates importantes', {
            'fields': ('due_date', 'first_response_at', 'resolved_at', 'closed_at')
        }),
        ('SLA et métriques', {
            'fields': ('sla_deadline', 'response_time_minutes', 'resolution_time_minutes'),
            'classes': ('collapse',)
        }),
        ('Satisfaction client', {
            'fields': ('satisfaction_rating', 'satisfaction_comment'),
            'classes': ('collapse',)
        }),
        ('Statistiques', {
            'fields': ('views_count', 'last_activity_at'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['client', 'project', 'category', 'reporter', 'assigned_to']
    readonly_fields = [
        'ticket_number', 'first_response_at', 'resolved_at', 'closed_at',
        'response_time_minutes', 'resolution_time_minutes', 'views_count', 
        'last_activity_at', 'created_at', 'updated_at'
    ]
    inlines = [TicketMessageInline, TicketAttachmentInline]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'open': '#007bff',
            'in_progress': '#17a2b8',
            'waiting_client': '#ffc107',
            'waiting_internal': '#fd7e14',
            'resolved': '#28a745',
            'closed': '#6c757d',
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
            'urgent': '#dc3545',
            'critical': '#dc3545'
        }
        icons = {
            'low': '🔽',
            'normal': '➡️',
            'high': '🔼',
            'urgent': '🔥',
            'critical': '🚨'
        }
        color = colors.get(obj.priority, '#007bff')
        icon = icons.get(obj.priority, '➡️')
        return format_html(
            '{} <span style="color: {}; font-weight: bold;">{}</span>',
            icon, color, obj.get_priority_display()
        )
    priority_display.short_description = 'Priorité'
    
    def is_overdue_display(self, obj):
        """Display overdue status."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">⚠️ En retard</span>'
            )
        elif obj.is_sla_breach:
            return format_html(
                '<span style="color: #fd7e14; font-weight: bold;">⚠️ SLA dépassé</span>'
            )
        return format_html(
            '<span style="color: #28a745;">✅ Dans les temps</span>'
        )
    is_overdue_display.short_description = 'État'
    
    def satisfaction_rating_display(self, obj):
        """Display satisfaction rating with stars."""
        if obj.satisfaction_rating:
            stars = '⭐' * obj.satisfaction_rating
            empty_stars = '☆' * (5 - obj.satisfaction_rating)
            return format_html(
                '<span title="{}/5">{}{}</span>',
                obj.satisfaction_rating, stars, empty_stars
            )
        return '-'
    satisfaction_rating_display.short_description = 'Satisfaction'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'client', 'project', 'category', 'reporter', 'assigned_to'
        )


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    """
    Admin interface for TicketMessage model.
    """
    list_display = [
        'ticket', 'message_type_display', 'author', 'content_preview', 
        'is_internal', 'created_at'
    ]
    list_filter = ['message_type', 'is_internal', 'created_at']
    search_fields = ['content', 'ticket__ticket_number', 'author__username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Message', {
            'fields': ('ticket', 'message_type', 'content', 'author')
        }),
        ('Paramètres', {
            'fields': ('is_internal',)
        }),
        ('Métadonnées techniques', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['ticket', 'author']
    readonly_fields = ['created_at', 'updated_at']
    
    def message_type_display(self, obj):
        """Display message type with icon."""
        icons = {
            'reply': '💬',
            'note': '📝',
            'status_change': '🔄',
            'assignment': '👤'
        }
        icon = icons.get(obj.message_type, '💬')
        return format_html(
            '{} {}',
            icon, obj.get_message_type_display()
        )
    message_type_display.short_description = 'Type'
    
    def content_preview(self, obj):
        """Display a preview of the message content."""
        if len(obj.content) > 100:
            return f"{obj.content[:100]}..."
        return obj.content
    content_preview.short_description = 'Contenu'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('ticket', 'author')


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    """
    Admin interface for TicketAttachment model.
    """
    list_display = [
        'file_name', 'ticket', 'message', 'file_size_display', 
        'mime_type', 'uploaded_by', 'created_at'
    ]
    list_filter = ['mime_type', 'created_at']
    search_fields = ['file_name', 'ticket__ticket_number', 'uploaded_by__username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Fichier', {
            'fields': ('file', 'file_name')
        }),
        ('Association', {
            'fields': ('ticket', 'message', 'uploaded_by')
        }),
        ('Métadonnées', {
            'fields': ('file_size', 'mime_type')
        }),
    )
    
    autocomplete_fields = ['ticket', 'message', 'uploaded_by']
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
        return super().get_queryset(request).select_related('ticket', 'message', 'uploaded_by')
