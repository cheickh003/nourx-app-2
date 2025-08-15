"""
Models for clients app.
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel


class Client(BaseModel):
    """
    Client company/organization model.
    """
    name = models.CharField(max_length=200, verbose_name="Nom du client")
    email = models.EmailField(verbose_name="Email principal")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    
    # Contact principal
    main_contact_name = models.CharField(max_length=100, verbose_name="Nom du contact principal")
    main_contact_email = models.EmailField(verbose_name="Email du contact principal")
    main_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Informations business
    industry = models.CharField(max_length=100, blank=True, null=True, verbose_name="Secteur d'activité")
    company_size = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        choices=[
            ("1-10", "1-10 employés"),
            ("11-50", "11-50 employés"),
            ("51-200", "51-200 employés"),
            ("200+", "Plus de 200 employés"),
        ],
        verbose_name="Taille de l'entreprise"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ("prospect", "Prospect"),
            ("active", "Client actif"),
            ("inactive", "Client inactif"),
            ("archived", "Archivé"),
        ],
        default="prospect",
        verbose_name="Statut"
    )
    
    # Métadonnées
    notes = models.TextField(blank=True, null=True, verbose_name="Notes internes")
    
    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class ClientMember(BaseModel):
    """
    User membership in a client organization.
    """
    ROLE_CHOICES = [
        ("owner", "Propriétaire"),
        ("admin", "Administrateur"),
        ("member", "Membre"),
        ("viewer", "Lecteur seul"),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name="client_memberships",
        verbose_name="Utilisateur"
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name="Client"
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="member",
        verbose_name="Rôle"
    )
    
    # Permissions spéciales
    can_view_billing = models.BooleanField(default=False, verbose_name="Peut voir la facturation")
    can_manage_team = models.BooleanField(default=False, verbose_name="Peut gérer l'équipe")
    
    class Meta:
        verbose_name = "Membre client"
        verbose_name_plural = "Membres clients"
        unique_together = [('user', 'client')]
        indexes = [
            models.Index(fields=['user', 'client']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.client.name} ({self.get_role_display()})"