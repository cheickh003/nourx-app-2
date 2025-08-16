"""
Views for documents app.
"""
import uuid
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
import boto3

from apps.core.permissions import ClientScopedPermission, ClientAdminPermission
from apps.clients.models import ClientMember
from .models import Document, DocumentFolder
from .serializers import (
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentCreateSerializer,
    DocumentFolderSerializer,
)


def _boto3_client():
    return boto3.client(
        "s3",
        endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None),
        region_name=getattr(settings, "AWS_S3_REGION_NAME", None),
        aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", None),
        aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", None),
    )


class DocumentViewSet(viewsets.ModelViewSet):
    """
    Manage project documents with S3 presigned URLs for secure download/upload.
    """
    permission_classes = [ClientScopedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["project", "folder", "visibility", "version_status"]
    search_fields = ["title", "description", "file_name", "tags"]
    ordering_fields = ["created_at", "updated_at", "file_name", "file_size"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Document.objects.select_related("project", "folder", "uploaded_by", "project__client")
        if not user.is_authenticated:
            return Document.objects.none()
        # Staff/admin see everything
        if user.is_staff or (hasattr(user, "profile") and user.profile.role == "admin"):
            return qs
        # Filter by client membership and visibility (exclude internal)
        client_ids = list(
            ClientMember.objects.filter(user=user).values_list("client_id", flat=True)
        )
        return qs.filter(project__client__id__in=client_ids).exclude(visibility="internal")

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return DocumentCreateSerializer
        return DocumentDetailSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "presign_upload"]:
            permission_classes = [ClientAdminPermission]
        else:
            permission_classes = [ClientScopedPermission]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=["get"])
    def download_url(self, request, pk=None):
        """Return a time-limited presigned URL to download the file."""
        doc = self.get_object()
        if not doc.s3_bucket or not doc.s3_key:
            # Fall back to storage URL if missing metadata
            return Response({"url": doc.file.url})
        client = _boto3_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": doc.s3_bucket, "Key": doc.s3_key},
            ExpiresIn=60 * 5,
        )
        # Update access counters
        doc.increment_download_count()
        return Response({"url": url})

    @action(detail=False, methods=["post"])
    def presign_upload(self, request):
        """
        Generate a presigned POST for direct S3 upload.
        Requires: project (id), file_name, mime_type
        Returns: url, fields, key
        """
        project_id = request.data.get("project")
        file_name = request.data.get("file_name")
        mime_type = request.data.get("mime_type") or "application/octet-stream"
        if not project_id or not file_name:
            return Response({"error": "project and file_name are required"}, status=400)
        # Key pattern under project
        key = f"projects/{project_id}/documents/{uuid.uuid4()}/{file_name}"
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)
        client = _boto3_client()
        conditions = [
            {"acl": "private"},
            ["starts-with", "$Content-Type", ""],
            ["content-length-range", 0, 104857600],  # up to 100MB
        ]
        fields = {"acl": "private", "Content-Type": mime_type}
        post = client.generate_presigned_post(
            Bucket=bucket,
            Key=key,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=60 * 5,
        )
        return Response({"bucket": bucket, "key": key, **post})


class DocumentFolderViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentFolderSerializer
    permission_classes = [ClientAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["project", "parent"]
    search_fields = ["name", "description"]
    ordering_fields = ["order", "name", "created_at"]
    ordering = ["order", "name"]

    def get_queryset(self):
        user = self.request.user
        qs = DocumentFolder.objects.select_related("project", "parent", "project__client")
        if not user.is_authenticated:
            return DocumentFolder.objects.none()
        if user.is_staff or (hasattr(user, "profile") and user.profile.role == "admin"):
            return qs
        client_ids = list(
            ClientMember.objects.filter(user=user).values_list("client_id", flat=True)
        )
        return qs.filter(project__client__id__in=client_ids)

