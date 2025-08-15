"""
Models for audit app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.core.models import BaseModel


class AuditLog(BaseModel):
    """
    Audit log for tracking user actions and system changes.
    """
    ACTION_CHOICES = [
        ("create", "Création"),
        ("update", "Modification"),
        ("delete", "Suppression"),
        ("login", "Connexion"),
        ("logout", "Déconnexion"),
        ("view", "Consultation"),
        ("download", "Téléchargement"),
        ("export", "Export"),
        ("import", "Import"),
        ("send", "Envoi"),
        ("approve", "Approbation"),
        ("reject", "Rejet"),
        ("archive", "Archivage"),
        ("restore", "Restauration"),
        ("payment", "Paiement"),
        ("refund", "Remboursement"),
        ("other", "Autre"),
    ]
    
    LEVEL_CHOICES = [
        ("info", "Information"),
        ("warning", "Avertissement"),
        ("error", "Erreur"),
        ("critical", "Critique"),
    ]
    
    # Qui a fait l'action
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        verbose_name="Acteur"
    )
    
    # Action effectuée
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name="Action"
    )
    
    # Description de l'action
    description = models.CharField(max_length=255, verbose_name="Description")
    
    # Niveau d'importance
    level = models.CharField(
        max_length=10,
        choices=LEVEL_CHOICES,
        default="info",
        verbose_name="Niveau"
    )
    
    # Objet concerné (generic foreign key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Type d'objet"
    )
    object_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="ID de l'objet")
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Données avant/après changement (pour les updates)
    old_values = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Valeurs avant",
        help_text="État avant la modification"
    )
    new_values = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Nouvelles valeurs",
        help_text="État après la modification"
    )
    
    # Métadonnées techniques
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    session_key = models.CharField(max_length=40, blank=True, null=True, verbose_name="Clé de session")
    
    # Contexte métier
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="audit_logs",
        verbose_name="Client concerné"
    )
    
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="audit_logs",
        verbose_name="Projet concerné"
    )
    
    # Données supplémentaires (JSON libre)
    extra_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Données supplémentaires"
    )
    
    # Groupement d'actions (pour les opérations en batch)
    batch_id = models.CharField(
        max_length=36,
        blank=True,
        null=True,
        verbose_name="ID de batch",
        help_text="Identifiant pour grouper plusieurs actions liées"
    )
    
    class Meta:
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['level', 'created_at']),
            models.Index(fields=['batch_id']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        actor_name = self.actor.get_full_name() or self.actor.username if self.actor else "Système"
        return f"{actor_name} - {self.get_action_display()} - {self.description}"
    
    @classmethod
    def log_action(cls, actor, action, description, content_object=None, 
                   old_values=None, new_values=None, client=None, project=None,
                   ip_address=None, user_agent=None, session_key=None,
                   level="info", extra_data=None, batch_id=None):
        """
        Convenience method to create audit log entries.
        """
        return cls.objects.create(
            actor=actor,
            action=action,
            description=description,
            content_object=content_object,
            old_values=old_values,
            new_values=new_values,
            client=client,
            project=project,
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=session_key,
            level=level,
            extra_data=extra_data,
            batch_id=batch_id
        )
    
    @classmethod
    def log_login(cls, user, ip_address=None, user_agent=None, session_key=None):
        """Log user login."""
        return cls.log_action(
            actor=user,
            action="login",
            description=f"Connexion de {user.get_full_name() or user.username}",
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=session_key
        )
    
    @classmethod
    def log_logout(cls, user, ip_address=None, user_agent=None, session_key=None):
        """Log user logout."""
        return cls.log_action(
            actor=user,
            action="logout",
            description=f"Déconnexion de {user.get_full_name() or user.username}",
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=session_key
        )
    
    @classmethod
    def log_create(cls, actor, obj, description=None, client=None, project=None, **kwargs):
        """Log object creation."""
        desc = description or f"Création de {obj._meta.verbose_name}: {str(obj)}"
        return cls.log_action(
            actor=actor,
            action="create",
            description=desc,
            content_object=obj,
            client=client,
            project=project,
            **kwargs
        )
    
    @classmethod
    def log_update(cls, actor, obj, old_values=None, new_values=None, 
                   description=None, client=None, project=None, **kwargs):
        """Log object update."""
        desc = description or f"Modification de {obj._meta.verbose_name}: {str(obj)}"
        return cls.log_action(
            actor=actor,
            action="update",
            description=desc,
            content_object=obj,
            old_values=old_values,
            new_values=new_values,
            client=client,
            project=project,
            **kwargs
        )
    
    @classmethod
    def log_delete(cls, actor, obj, description=None, client=None, project=None, **kwargs):
        """Log object deletion."""
        desc = description or f"Suppression de {obj._meta.verbose_name}: {str(obj)}"
        return cls.log_action(
            actor=actor,
            action="delete",
            description=desc,
            content_object=obj,
            client=client,
            project=project,
            **kwargs
        )
    
    @property
    def changes_summary(self):
        """Get a summary of changes for updates."""
        if not self.old_values or not self.new_values:
            return None
        
        changes = []
        for field, new_value in self.new_values.items():
            old_value = self.old_values.get(field)
            if old_value != new_value:
                changes.append({
                    'field': field,
                    'old': old_value,
                    'new': new_value
                })
        return changes


class AuditLogArchive(BaseModel):
    """
    Archived audit logs for long-term storage.
    """
    # Archive metadata
    archive_date = models.DateField(verbose_name="Date d'archivage")
    logs_count = models.PositiveIntegerField(verbose_name="Nombre de logs")
    
    # Date range of archived logs
    from_date = models.DateTimeField(verbose_name="Période du")
    to_date = models.DateTimeField(verbose_name="Période au")
    
    # Compressed data
    compressed_data = models.BinaryField(verbose_name="Données compressées")
    compression_ratio = models.FloatField(
        blank=True,
        null=True,
        verbose_name="Ratio de compression"
    )
    
    # Checksum for integrity
    checksum = models.CharField(max_length=64, verbose_name="Somme de contrôle SHA-256")
    
    class Meta:
        verbose_name = "Archive de logs d'audit"
        verbose_name_plural = "Archives de logs d'audit"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['archive_date']),
            models.Index(fields=['from_date', 'to_date']),
        ]
    
    def __str__(self):
        return f"Archive du {self.archive_date} ({self.logs_count} logs)"