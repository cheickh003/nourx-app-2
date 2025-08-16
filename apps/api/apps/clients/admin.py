"""
Admin configuration for clients app.
"""
from django.contrib import admin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import Client, ClientMember


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Admin interface for Client model.
    """
    list_display = [
        'name', 'status', 'industry', 'company_size', 
        'main_contact_name', 'main_contact_email', 'created_at'
    ]
    list_filter = ['status', 'industry', 'company_size', 'created_at']
    search_fields = ['name', 'main_contact_name', 'main_contact_email', 'email']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'email', 'phone', 'address', 'status')
        }),
        ('Contact principal', {
            'fields': ('main_contact_name', 'main_contact_email', 'main_contact_phone')
        }),
        ('Informations business', {
            'fields': ('industry', 'company_size')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['created_at', 'updated_at'])
        return readonly


class ClientMemberInline(admin.TabularInline):
    """
    Inline for managing client members.
    """
    model = ClientMember
    extra = 0
    fields = ['user']
    autocomplete_fields = ['user']


@admin.register(ClientMember)
class ClientMemberAdmin(admin.ModelAdmin):
    """
    Admin interface for ClientMember model.
    """
    list_display = ['user', 'client', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'client__name']
    ordering = ['-created_at']
    
    fieldsets = ((
        'Association', {
            'fields': ('user', 'client')
        }
    ),)
    
    autocomplete_fields = ['user', 'client']
    readonly_fields = ['created_at', 'updated_at']
