"""
Models for documents app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from apps.core.models import BaseModel


class DocumentFolder(BaseModel):
    """
    Folder structure for organizing documents.
    """
    # Relations
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="document_folders",
        verbose_name="Projet"
    )
    
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="subfolders",
        verbose_name="Dossier parent"
    )
    
    # Informations de base
    name = models.CharField(max_length=100, verbose_name="Nom du dossier")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Ordre
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    class Meta:
        verbose_name = "Dossier de documents"
        verbose_name_plural = "Dossiers de documents"
        ordering = ['order', 'name']
        unique_together = [('project', 'parent', 'name')]
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name}/{self.name}"
        return f"{self.project.title}/{self.name}"


class Document(BaseModel):
    """
    Document model with S3 storage support.
    """
    VISIBILITY_CHOICES = [
        ("public", "Public - Visible par le client"),
        ("internal", "Interne - Visible par l'équipe NOURX seulement"),
        ("restricted", "Restreint - Accès limité"),
    ]
    
    VERSION_STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("review", "En révision"),
        ("approved", "Approuvé"),
        ("archived", "Archivé"),
    ]
    
    # Relations
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="documents",
        verbose_name="Projet"
    )
    
    folder = models.ForeignKey(
        DocumentFolder,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="documents",
        verbose_name="Dossier"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
        verbose_name="Téléchargé par"
    )
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre du document")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Fichier et stockage S3
    file = models.FileField(
        upload_to="documents/",
        verbose_name="Fichier",
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                                  'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar']
            )
        ]
    )
    
    # Métadonnées du fichier
    file_name = models.CharField(max_length=255, verbose_name="Nom du fichier original")
    file_size = models.BigIntegerField(verbose_name="Taille du fichier (bytes)")
    mime_type = models.CharField(max_length=100, verbose_name="Type MIME")
    
    # Stockage S3
    s3_bucket = models.CharField(max_length=100, blank=True, null=True, verbose_name="Bucket S3")
    s3_key = models.CharField(max_length=500, blank=True, null=True, verbose_name="Clé S3")
    
    # Visibilité et accès
    visibility = models.CharField(
        max_length=15,
        choices=VISIBILITY_CHOICES,
        default="public",
        verbose_name="Visibilité"
    )
    
    # Gestion des versions
    version = models.CharField(max_length=20, default="1.0", verbose_name="Version")
    version_status = models.CharField(
        max_length=15,
        choices=VERSION_STATUS_CHOICES,
        default="draft",
        verbose_name="Statut de la version"
    )
    
    previous_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="newer_versions",
        verbose_name="Version précédente"
    )
    
    # Métadonnées
    tags = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Tags séparés par des virgules",
        verbose_name="Tags"
    )
    
    # Statistiques
    download_count = models.PositiveIntegerField(default=0, verbose_name="Nombre de téléchargements")
    last_downloaded_at = models.DateTimeField(blank=True, null=True, verbose_name="Dernier téléchargement")
    
    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'visibility']),
            models.Index(fields=['folder']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['version_status']),
            models.Index(fields=['mime_type']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    @property
    def tag_list(self):
        """Return tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    @property
    def file_extension(self):
        """Get file extension."""
        if self.file_name:
            return self.file_name.split('.')[-1].lower()
        return ''
    
    @property
    def is_image(self):
        """Check if document is an image."""
        return self.file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    
    @property
    def is_pdf(self):
        """Check if document is a PDF."""
        return self.file_extension == 'pdf'
    
    def increment_download_count(self):
        """Increment download count."""
        from django.utils import timezone
        self.download_count += 1
        self.last_downloaded_at = timezone.now()
        self.save(update_fields=['download_count', 'last_downloaded_at'])


class DocumentAccess(BaseModel):
    """
    Track document access for security and analytics.
    """
    ACTION_CHOICES = [
        ("view", "Consultation"),
        ("download", "Téléchargement"),
        ("share", "Partage"),
        ("delete", "Suppression"),
    ]
    
    # Relations
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="access_logs",
        verbose_name="Document"
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="document_accesses",
        verbose_name="Utilisateur"
    )
    
    # Action
    action = models.CharField(
        max_length=10,
        choices=ACTION_CHOICES,
        verbose_name="Action"
    )
    
    # Métadonnées techniques
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    
    class Meta:
        verbose_name = "Accès document"
        verbose_name_plural = "Accès documents"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['document', 'created_at']),
            models.Index(fields=['user', 'action']),
            models.Index(fields=['action', 'created_at']),
        ]
    
    def __str__(self):
        user_str = self.user.get_full_name() or self.user.username if self.user else "Anonyme"
        return f"{user_str} - {self.get_action_display()} - {self.document.title}"