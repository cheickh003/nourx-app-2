"""
Serializers for support app.
"""
from rest_framework import serializers
from .models import Ticket, TicketMessage, TicketAttachment


class UserMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class ProjectMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()


class TicketListSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(source="messages.count", read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    project = ProjectMiniSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "subject",
            "description",
            "status",
            "priority",
            "created_at",
            "updated_at",
            "messages_count",
            "assigned_to",
            "project",
        ]


class TicketDetailSerializer(TicketListSerializer):
    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + [
            "satisfaction_rating",
            "satisfaction_comment",
            "tags",
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "subject",
            "description",
            "priority",
            "project",
            "category",
        ]
        extra_kwargs = {
            "subject": {"required": True},
            "description": {"required": True},
        }


class TicketMessageSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    message = serializers.CharField(source="content")
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ["id", "author", "message", "created_at", "is_internal", "attachments"]

    def get_attachments(self, obj):
        items = obj.attachments.all()
        out = []
        for a in items:
            url = a.file.url  # Ensure S3 generates a URL; misconfig should raise
            out.append({
                'id': str(a.id),
                'file_name': a.file_name,
                'file_size': a.file_size,
                'mime_type': a.mime_type,
                'url': url,
                'message_id': str(a.message.id) if a.message_id else None,
            })
        return out


class TicketMessageCreateSerializer(serializers.ModelSerializer):
    message = serializers.CharField(source="content")

    class Meta:
        model = TicketMessage
        fields = ["message", "is_internal"]
