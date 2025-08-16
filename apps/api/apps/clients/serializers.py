"""
Serializers for clients app (admin CRUD).
"""
from rest_framework import serializers
from .models import Client, ClientMember
from apps.core.serializers import UserProfileSerializer


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "address",
            "main_contact_name",
            "main_contact_email",
            "main_contact_phone",
            "industry",
            "company_size",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientMemberSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    client = ClientSerializer(read_only=True)

    class Meta:
        model = ClientMember
        fields = [
            "id",
            "user",
            "client",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "user", "client"]
