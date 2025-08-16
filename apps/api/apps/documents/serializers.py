"""
Serializers for documents app.
"""
from rest_framework import serializers
from .models import Document, DocumentFolder


class DocumentFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentFolder
        fields = [
            "id",
            "name",
            "description",
            "order",
            "parent",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DocumentListSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source="project.title", read_only=True)
    folder_name = serializers.CharField(source="folder.name", read_only=True)
    tag_list = serializers.ReadOnlyField()

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_title",
            "folder",
            "folder_name",
            "file_name",
            "file_size",
            "mime_type",
            "visibility",
            "version",
            "version_status",
            "download_count",
            "tag_list",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "download_count", "tag_list"]


class DocumentDetailSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source="project.title", read_only=True)
    folder_name = serializers.CharField(source="folder.name", read_only=True)
    tag_list = serializers.ReadOnlyField()

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_title",
            "folder",
            "folder_name",
            "file_name",
            "file_size",
            "mime_type",
            "visibility",
            "version",
            "version_status",
            "previous_version",
            "tags",
            "tag_list",
            "download_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "download_count",
            "tag_list",
        ]


class DocumentCreateSerializer(serializers.ModelSerializer):
    # Used to bind S3 uploaded object to the record
    s3_key = serializers.CharField(write_only=True)

    class Meta:
        model = Document
        fields = [
            "title",
            "description",
            "project",
            "folder",
            "file_name",
            "file_size",
            "mime_type",
            "visibility",
            "version",
            "version_status",
            "tags",
            "s3_key",
        ]

    def create(self, validated_data):
        s3_key = validated_data.pop("s3_key")
        request = self.context.get("request")
        user = getattr(request, "user", None)
        doc = Document(**validated_data)
        doc.s3_key = s3_key
        from django.conf import settings
        doc.s3_bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)
        # Bind FileField to existing S3 key (no upload here)
        doc.file.name = s3_key
        if user and user.is_authenticated:
            doc.uploaded_by = user
        doc.save()
        return doc

