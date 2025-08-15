"""
Admin configuration for projects app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Project, Milestone


class MilestoneInline(admin.TabularInline):
    """
    Inline for managing project milestones.
    """
    model = Milestone
    extra = 0
    fields = ['title', 'status', 'due_date', 'progress', 'order']
    ordering = ['order', 'due_date']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Admin interface for Project model.
    """
    list_display = [
        'title', 'client', 'status', 'priority', 'progress_display', 
        'project_manager', 'start_date', 'end_date', 'is_overdue_display'
    ]
    list_filter = ['status', 'priority', 'start_date', 'end_date', 'created_at']
    search_fields = ['title', 'description', 'client__name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'description', 'client')
        }),
        ('Status et priorité', {
            'fields': ('status', 'priority', 'progress')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'completed_at')
        }),
        ('Budget et temps', {
            'fields': ('estimated_hours', 'actual_hours')
        }),
        ('Équipe', {
            'fields': ('project_manager', 'team_members')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['team_members']
    autocomplete_fields = ['client', 'project_manager']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    inlines = [MilestoneInline]
    
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
            '<div style="width: 100px; background-color: #e9ecef;">'
            '<div style="width: {}px; height: 20px; background-color: {}; text-align: center; color: white; font-size: 12px; line-height: 20px;">'
            '{}%</div></div>',
            obj.progress, color, obj.progress
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
        return super().get_queryset(request).select_related('client', 'project_manager')


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    """
    Admin interface for Milestone model.
    """
    list_display = [
        'title', 'project', 'status', 'due_date', 'progress_display', 
        'is_overdue_display', 'order'
    ]
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['title', 'description', 'project__title']
    ordering = ['project', 'order', 'due_date']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('project', 'title', 'description')
        }),
        ('Status et progression', {
            'fields': ('status', 'progress', 'order')
        }),
        ('Dates', {
            'fields': ('due_date', 'completed_at')
        }),
    )
    
    autocomplete_fields = ['project']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
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
        return super().get_queryset(request).select_related('project', 'project__client')
