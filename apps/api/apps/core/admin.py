"""
Admin configuration for core app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile"


class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ("username", "email", "first_name", "last_name", "get_role", "is_staff")
    list_filter = ("profile__role", "is_staff", "is_superuser", "is_active", "date_joined")
    search_fields = ("username", "first_name", "last_name", "email")
    
    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return "-"
    get_role.short_description = "Rôle"


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "phone", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
    readonly_fields = ("created_at", "updated_at")
