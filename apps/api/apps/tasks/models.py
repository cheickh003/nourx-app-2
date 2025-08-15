"""
Models for tasks app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class Task(BaseModel):
    """
    Task model for project tasks.
    """
    STATUS_CHOICES = [
        ("todo", "À faire"),
        ("in_progress", "En cours"),
        ("review", "En révision"),
        ("done", "Terminé"),
        ("blocked", "Bloqué"),
        ("cancelled", "Annulé"),
    ]
    
    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
    ]
    
    TYPE_CHOICES = [
        ("feature", "Fonctionnalité"),
        ("bug", "Bug"),
        ("task", "Tâche"),
        ("improvement", "Amélioration"),
        ("documentation", "Documentation"),
        ("testing", "Test"),
    ]
    
    # Relations
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="Projet"
    )
    
    milestone = models.ForeignKey(
        "projects.Milestone",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
        verbose_name="Jalon"
    )
    
    parent_task = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="subtasks",
        verbose_name="Tâche parente"
    )
    
    # Assignation
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_tasks",
        verbose_name="Assigné à"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
        verbose_name="Créé par"
    )
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre de la tâche")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Status et priorité
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="todo",
        verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="normal",
        verbose_name="Priorité"
    )
    task_type = models.CharField(
        max_length=15,
        choices=TYPE_CHOICES,
        default="task",
        verbose_name="Type"
    )
    
    # Dates
    due_date = models.DateField(blank=True, null=True, verbose_name="Date d'échéance")
    started_at = models.DateTimeField(blank=True, null=True, verbose_name="Démarré le")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Terminé le")
    
    # Estimation et temps
    estimated_hours = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        blank=True, 
        null=True,
        verbose_name="Heures estimées"
    )
    actual_hours = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=0,
        verbose_name="Heures réelles"
    )
    
    # Progrès (0-100%)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progression (%)"
    )
    
    # Ordre pour le kanban
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    # Tags
    tags = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Tags séparés par des virgules",
        verbose_name="Tags"
    )
    
    class Meta:
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['priority']),
            models.Index(fields=['due_date']),
            models.Index(fields=['status', 'order']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    @property
    def is_overdue(self):
        """Check if task is overdue."""
        from django.utils import timezone
        return (
            self.due_date and 
            self.due_date < timezone.now().date() and 
            self.status not in ['done', 'cancelled']
        )
    
    @property
    def tag_list(self):
        """Return tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []


class TaskComment(BaseModel):
    """
    Comment on a task.
    """
    # Relations
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Tâche"
    )
    
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_comments",
        verbose_name="Auteur"
    )
    
    # Contenu
    body = models.TextField(verbose_name="Commentaire")
    
    # Métadonnées
    is_internal = models.BooleanField(
        default=False,
        verbose_name="Commentaire interne",
        help_text="Visible seulement par l'équipe NOURX"
    )
    
    # Pièces jointes (optionnel)
    attachment = models.FileField(
        upload_to="task_comments/",
        blank=True,
        null=True,
        verbose_name="Pièce jointe"
    )
    
    class Meta:
        verbose_name = "Commentaire de tâche"
        verbose_name_plural = "Commentaires de tâches"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['task', 'created_at']),
            models.Index(fields=['author']),
        ]
    
    def __str__(self):
        return f"Commentaire de {self.author.get_full_name() or self.author.username} sur {self.task.title}"


class TaskAttachment(BaseModel):
    """
    File attachment for tasks.
    """
    # Relations
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Tâche"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_attachments",
        verbose_name="Téléchargé par"
    )
    
    # Fichier
    file = models.FileField(upload_to="task_attachments/", verbose_name="Fichier")
    file_name = models.CharField(max_length=255, verbose_name="Nom du fichier")
    file_size = models.BigIntegerField(verbose_name="Taille du fichier")
    mime_type = models.CharField(max_length=100, verbose_name="Type MIME")
    
    class Meta:
        verbose_name = "Pièce jointe de tâche"
        verbose_name_plural = "Pièces jointes de tâches"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task']),
        ]
    
    def __str__(self):
        return f"{self.file_name} - {self.task.title}"