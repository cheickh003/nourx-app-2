"""
Serializers for core app.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile.
    """
    class Meta:
        model = Profile
        fields = ["role", "phone", "avatar"]


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user with profile information.
    """
    profile = ProfileSerializer(read_only=True)
    client_ids = serializers.SerializerMethodField()
    
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "profile",
            "client_ids",
        ]
        read_only_fields = ["id", "username", "is_staff", "is_superuser"]
    
    def get_client_ids(self, obj):
        """
        Get list of client IDs this user has access to.
        """
        if hasattr(obj, 'profile') and obj.profile.role == 'admin':
            # Admin has access to all clients
            from apps.clients.models import Client
            return list(Client.objects.values_list('id', flat=True))
        elif hasattr(obj, 'client_memberships'):
            # Regular user has access to their clients
            return list(obj.client_memberships.values_list('client__id', flat=True))
        return []
