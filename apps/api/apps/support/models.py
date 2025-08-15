"""
Models for support app.
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel


class TicketCategory(BaseModel):
    """
    Support ticket categories.
    """
    name = models.CharField(max_length=100, verbose_name="Nom de la catégorie")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    color = models.CharField(
        max_length=7,
        default="#007bff",
        help_text="Couleur hexadécimale (ex: #007bff)",
        verbose_name="Couleur"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    class Meta:
        verbose_name = "Catégorie de ticket"
        verbose_name_plural = "Catégories de tickets"
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Ticket(BaseModel):
    """
    Support ticket model.
    """
    STATUS_CHOICES = [
        ("open", "Ouvert"),
        ("in_progress", "En cours"),
        ("waiting_client", "En attente client"),
        ("waiting_internal", "En attente interne"),
        ("resolved", "Résolu"),
        ("closed", "Fermé"),
        ("cancelled", "Annulé"),
    ]
    
    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
        ("critical", "Critique"),
    ]
    
    SOURCE_CHOICES = [
        ("web", "Interface web"),
        ("email", "Email"),
        ("phone", "Téléphone"),
        ("chat", "Chat"),
        ("internal", "Interne"),
    ]
    
    # Relations
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="tickets",
        verbose_name="Client"
    )
    
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tickets",
        verbose_name="Projet"
    )
    
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tickets",
        verbose_name="Catégorie"
    )
    
    # Personnes impliquées
    reporter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_tickets",
        verbose_name="Rapporté par"
    )
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_tickets",
        verbose_name="Assigné à"
    )
    
    # Numérotation
    ticket_number = models.CharField(max_length=20, unique=True, verbose_name="Numéro de ticket")
    
    # Contenu
    subject = models.CharField(max_length=200, verbose_name="Sujet")
    description = models.TextField(verbose_name="Description")
    
    # Status et priorité
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open",
        verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="normal",
        verbose_name="Priorité"
    )
    source = models.CharField(
        max_length=10,
        choices=SOURCE_CHOICES,
        default="web",
        verbose_name="Source"
    )
    
    # Dates importantes
    due_date = models.DateTimeField(blank=True, null=True, verbose_name="Date d'échéance")
    first_response_at = models.DateTimeField(blank=True, null=True, verbose_name="Première réponse le")
    resolved_at = models.DateTimeField(blank=True, null=True, verbose_name="Résolu le")
    closed_at = models.DateTimeField(blank=True, null=True, verbose_name="Fermé le")
    
    # SLA et métriques
    sla_deadline = models.DateTimeField(blank=True, null=True, verbose_name="Échéance SLA")
    response_time_minutes = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Temps de réponse (minutes)"
    )
    resolution_time_minutes = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Temps de résolution (minutes)"
    )
    
    # Satisfaction client
    satisfaction_rating = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        choices=[(i, f"{i} étoile{'s' if i > 1 else ''}") for i in range(1, 6)],
        verbose_name="Note de satisfaction"
    )
    satisfaction_comment = models.TextField(
        blank=True,
        null=True,
        verbose_name="Commentaire de satisfaction"
    )
    
    # Métadonnées
    tags = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Tags séparés par des virgules",
        verbose_name="Tags"
    )
    
    # Visibilité
    is_public = models.BooleanField(
        default=True,
        verbose_name="Public",
        help_text="Visible par le client"
    )
    
    # Statistiques
    views_count = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")
    last_activity_at = models.DateTimeField(auto_now=True, verbose_name="Dernière activité")
    
    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['ticket_number']),
            models.Index(fields=['due_date']),
            models.Index(fields=['sla_deadline']),
        ]
    
    def __str__(self):
        return f"#{self.ticket_number} - {self.subject}"
    
    def save(self, *args, **kwargs):
        # Auto-generate ticket number if not provided
        if not self.ticket_number:
            from django.utils import timezone
            year = timezone.now().year
            count = Ticket.objects.filter(created_at__year=year).count() + 1
            self.ticket_number = f"{year}{count:04d}"
        
        super().save(*args, **kwargs)
    
    @property
    def tag_list(self):
        """Return tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    @property
    def is_overdue(self):
        """Check if ticket is overdue."""
        from django.utils import timezone
        return (
            self.due_date and
            self.due_date < timezone.now() and
            self.status not in ['resolved', 'closed', 'cancelled']
        )
    
    @property
    def is_sla_breach(self):
        """Check if SLA deadline is breached."""
        from django.utils import timezone
        return (
            self.sla_deadline and
            self.sla_deadline < timezone.now() and
            self.status not in ['resolved', 'closed', 'cancelled']
        )
    
    def calculate_response_time(self):
        """Calculate response time in minutes."""
        if self.first_response_at:
            delta = self.first_response_at - self.created_at
            self.response_time_minutes = int(delta.total_seconds() / 60)
            self.save(update_fields=['response_time_minutes'])
    
    def calculate_resolution_time(self):
        """Calculate resolution time in minutes."""
        if self.resolved_at:
            delta = self.resolved_at - self.created_at
            self.resolution_time_minutes = int(delta.total_seconds() / 60)
            self.save(update_fields=['resolution_time_minutes'])


class TicketMessage(BaseModel):
    """
    Messages/replies in a support ticket.
    """
    MESSAGE_TYPES = [
        ("reply", "Réponse"),
        ("note", "Note interne"),
        ("status_change", "Changement de statut"),
        ("assignment", "Assignation"),
    ]
    
    # Relations
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Ticket"
    )
    
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ticket_messages",
        verbose_name="Auteur"
    )
    
    # Contenu
    message_type = models.CharField(
        max_length=15,
        choices=MESSAGE_TYPES,
        default="reply",
        verbose_name="Type de message"
    )
    content = models.TextField(verbose_name="Contenu")
    
    # Visibilité
    is_internal = models.BooleanField(
        default=False,
        verbose_name="Message interne",
        help_text="Visible seulement par l'équipe NOURX"
    )
    
    # Métadonnées
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    
    class Meta:
        verbose_name = "Message de ticket"
        verbose_name_plural = "Messages de tickets"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket', 'created_at']),
            models.Index(fields=['author']),
            models.Index(fields=['message_type']),
        ]
    
    def __str__(self):
        author_name = self.author.get_full_name() or self.author.username if self.author else "Système"
        return f"{author_name} - {self.ticket.ticket_number}"
    
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        # Update first response time if this is the first non-internal reply
        if (is_new and 
            not self.is_internal and 
            self.message_type == 'reply' and
            not self.ticket.first_response_at):
            self.ticket.first_response_at = self.created_at
            self.ticket.calculate_response_time()


class TicketAttachment(BaseModel):
    """
    File attachments for support tickets.
    """
    # Relations
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Ticket"
    )
    
    message = models.ForeignKey(
        TicketMessage,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="attachments",
        verbose_name="Message"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ticket_attachments",
        verbose_name="Téléchargé par"
    )
    
    # Fichier
    file = models.FileField(upload_to="support/attachments/", verbose_name="Fichier")
    file_name = models.CharField(max_length=255, verbose_name="Nom du fichier")
    file_size = models.BigIntegerField(verbose_name="Taille du fichier")
    mime_type = models.CharField(max_length=100, verbose_name="Type MIME")
    
    class Meta:
        verbose_name = "Pièce jointe de ticket"
        verbose_name_plural = "Pièces jointes de tickets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['message']),
        ]
    
    def __str__(self):
        return f"{self.file_name} - {self.ticket.ticket_number}"