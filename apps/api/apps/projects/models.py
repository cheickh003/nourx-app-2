"""
Models for projects app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class Project(BaseModel):
    """
    Project model for client projects.
    """
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("active", "Actif"),
        ("on_hold", "En pause"),
        ("completed", "Terminé"),
        ("cancelled", "Annulé"),
    ]
    
    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
    ]
    
    # Relations
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="projects",
        verbose_name="Client"
    )
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre du projet")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Status et priorité
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
        verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="normal",
        verbose_name="Priorité"
    )
    
    # Dates
    start_date = models.DateField(blank=True, null=True, verbose_name="Date de début")
    end_date = models.DateField(blank=True, null=True, verbose_name="Date de fin prévue")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Terminé le")
    
    # Progrès (0-100%)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progression (%)"
    )
    
    # Budget et coûts
    estimated_hours = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True,
        verbose_name="Heures estimées"
    )
    actual_hours = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0,
        verbose_name="Heures réelles"
    )
    
    # Équipe
    project_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="managed_projects",
        verbose_name="Chef de projet"
    )
    team_members = models.ManyToManyField(
        User,
        blank=True,
        related_name="team_projects",
        verbose_name="Membres de l'équipe"
    )
    
    # Métadonnées
    notes = models.TextField(blank=True, null=True, verbose_name="Notes internes")
    
    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.client.name}"
    
    @property
    def is_overdue(self):
        """Check if project is overdue."""
        from django.utils import timezone
        return (
            self.end_date and 
            self.end_date < timezone.now().date() and 
            self.status not in ['completed', 'cancelled']
        )


class Milestone(BaseModel):
    """
    Project milestone model.
    """
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("in_progress", "En cours"),
        ("completed", "Terminé"),
        ("blocked", "Bloqué"),
    ]
    
    # Relations
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="milestones",
        verbose_name="Projet"
    )
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre du jalon")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Statut"
    )
    
    # Dates
    due_date = models.DateField(verbose_name="Date d'échéance")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Terminé le")
    
    # Ordre
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    # Progrès (0-100%)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progression (%)"
    )
    
    class Meta:
        verbose_name = "Jalon"
        verbose_name_plural = "Jalons"
        ordering = ['order', 'due_date']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    @property
    def is_overdue(self):
        """Check if milestone is overdue."""
        from django.utils import timezone
        return (
            self.due_date < timezone.now().date() and 
            self.status != 'completed'
        )