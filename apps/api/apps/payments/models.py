"""
Models for payments app.
"""
from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from apps.core.models import BaseModel


class Payment(BaseModel):
    """
    Payment model for invoice payments via CinetPay.
    """
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("processing", "En traitement"),
        ("completed", "Terminé"),
        ("failed", "Échoué"),
        ("cancelled", "Annulé"),
        ("refunded", "Remboursé"),
        ("disputed", "Contesté"),
    ]
    
    METHOD_CHOICES = [
        ("card", "Carte bancaire"),
        ("mobile_money", "Mobile Money"),
        ("bank_transfer", "Virement bancaire"),
        ("wallet", "Portefeuille électronique"),
        ("other", "Autre"),
    ]
    
    # Relations
    invoice = models.ForeignKey(
        "billing.Invoice",
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Facture"
    )
    
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Client"
    )
    
    initiated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="initiated_payments",
        verbose_name="Initié par"
    )
    
    # Informations CinetPay
    cinetpay_transaction_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="ID Transaction CinetPay"
    )
    cinetpay_payment_token = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Token de paiement CinetPay"
    )
    cinetpay_checkout_url = models.URLField(
        blank=True,
        null=True,
        verbose_name="URL de checkout CinetPay"
    )
    
    # Montant et devise
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Montant"
    )
    currency = models.CharField(max_length=3, default="EUR", verbose_name="Devise")
    
    # Méthode et status
    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name="Méthode de paiement"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Statut"
    )
    
    # Dates importantes
    initiated_at = models.DateTimeField(auto_now_add=True, verbose_name="Initié le")
    processed_at = models.DateTimeField(blank=True, null=True, verbose_name="Traité le")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Terminé le")
    expires_at = models.DateTimeField(blank=True, null=True, verbose_name="Expire le")
    
    # Informations de paiement
    payer_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nom du payeur")
    payer_email = models.EmailField(blank=True, null=True, verbose_name="Email du payeur")
    payer_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone du payeur")
    
    # Payload brut des webhooks et réponses API
    raw_response_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Données brutes de réponse"
    )
    webhook_payload = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Payload webhook"
    )
    
    # Référence externe et description
    external_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Référence externe"
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Description"
    )
    
    # Frais
    fees_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Frais"
    )
    net_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Montant net"
    )
    
    # Métadonnées techniques
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    
    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['cinetpay_transaction_id']),
            models.Index(fields=['external_reference']),
        ]
    
    def __str__(self):
        return f"Paiement {self.cinetpay_transaction_id} - {self.invoice.invoice_number}"
    
    def save(self, *args, **kwargs):
        # Calculate net amount if not provided
        if self.net_amount is None:
            self.net_amount = self.amount - self.fees_amount
        super().save(*args, **kwargs)
    
    @property
    def is_successful(self):
        """Check if payment was successful."""
        return self.status == 'completed'
    
    @property
    def is_pending(self):
        """Check if payment is still pending."""
        return self.status in ['pending', 'processing']
    
    @property
    def is_failed(self):
        """Check if payment failed."""
        return self.status in ['failed', 'cancelled']


class PaymentAttempt(BaseModel):
    """
    Payment attempt tracking for analytics and debugging.
    """
    STATUS_CHOICES = [
        ("initiated", "Initié"),
        ("redirected", "Redirigé"),
        ("processing", "En traitement"),
        ("completed", "Terminé"),
        ("failed", "Échoué"),
        ("abandoned", "Abandonné"),
        ("expired", "Expiré"),
    ]
    
    CHANNEL_CHOICES = [
        ("web", "Web"),
        ("mobile", "Mobile"),
        ("api", "API"),
        ("webhook", "Webhook"),
    ]
    
    # Relations
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="attempts",
        verbose_name="Paiement"
    )
    
    invoice = models.ForeignKey(
        "billing.Invoice",
        on_delete=models.CASCADE,
        related_name="payment_attempts",
        verbose_name="Facture"
    )
    
    # Identifiants
    transaction_id = models.CharField(max_length=100, verbose_name="ID de transaction")
    attempt_number = models.PositiveIntegerField(default=1, verbose_name="Numéro de tentative")
    
    # Status et canal
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="initiated",
        verbose_name="Statut"
    )
    channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES,
        default="web",
        verbose_name="Canal"
    )
    
    # Montant tenté
    attempted_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Montant tenté"
    )
    
    # Dates
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="Démarré le")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Terminé le")
    
    # Informations d'erreur
    error_code = models.CharField(max_length=50, blank=True, null=True, verbose_name="Code d'erreur")
    error_message = models.TextField(blank=True, null=True, verbose_name="Message d'erreur")
    
    # Données brutes
    request_data = models.JSONField(blank=True, null=True, verbose_name="Données de requête")
    response_data = models.JSONField(blank=True, null=True, verbose_name="Données de réponse")
    
    # Métadonnées techniques
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    
    # Durée de la tentative (en secondes)
    duration_seconds = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Durée (secondes)"
    )
    
    class Meta:
        verbose_name = "Tentative de paiement"
        verbose_name_plural = "Tentatives de paiement"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'created_at']),
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Tentative {self.attempt_number} - {self.transaction_id}"
    
    def mark_completed(self):
        """Mark attempt as completed and calculate duration."""
        from django.utils import timezone
        now = timezone.now()
        self.completed_at = now
        self.status = 'completed'
        
        # Calculate duration
        if self.started_at:
            delta = now - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        
        self.save(update_fields=['completed_at', 'status', 'duration_seconds'])
    
    def mark_failed(self, error_code=None, error_message=None):
        """Mark attempt as failed with optional error details."""
        from django.utils import timezone
        now = timezone.now()
        self.completed_at = now
        self.status = 'failed'
        
        if error_code:
            self.error_code = error_code
        if error_message:
            self.error_message = error_message
        
        # Calculate duration
        if self.started_at:
            delta = now - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        
        self.save(update_fields=[
            'completed_at', 'status', 'error_code', 'error_message', 'duration_seconds'
        ])


class PaymentWebhook(BaseModel):
    """
    Webhook received from CinetPay for payment updates.
    """
    STATUS_CHOICES = [
        ("received", "Reçu"),
        ("processed", "Traité"),
        ("ignored", "Ignoré"),
        ("failed", "Échoué"),
    ]
    
    # Identifiants
    transaction_id = models.CharField(max_length=100, verbose_name="ID de transaction")
    webhook_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="ID du webhook"
    )
    
    # Relations (optionnelles car webhook peut arriver avant création du Payment)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="webhooks",
        verbose_name="Paiement"
    )
    
    # Status et traitement
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="received",
        verbose_name="Statut"
    )
    processed_at = models.DateTimeField(blank=True, null=True, verbose_name="Traité le")
    
    # Contenu du webhook
    event_type = models.CharField(max_length=50, verbose_name="Type d'événement")
    payload = models.JSONField(verbose_name="Payload")
    
    # Signature HMAC pour validation
    signature = models.CharField(max_length=255, verbose_name="Signature HMAC")
    is_signature_valid = models.BooleanField(default=False, verbose_name="Signature valide")
    
    # Métadonnées HTTP
    headers = models.JSONField(blank=True, null=True, verbose_name="En-têtes HTTP")
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    
    # Informations d'erreur
    error_message = models.TextField(blank=True, null=True, verbose_name="Message d'erreur")
    
    class Meta:
        verbose_name = "Webhook de paiement"
        verbose_name_plural = "Webhooks de paiement"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_id', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['event_type']),
            models.Index(fields=['is_signature_valid']),
        ]
    
    def __str__(self):
        return f"Webhook {self.event_type} - {self.transaction_id}"
    
    def mark_processed(self, payment=None):
        """Mark webhook as processed."""
        from django.utils import timezone
        self.status = 'processed'
        self.processed_at = timezone.now()
        if payment:
            self.payment = payment
        self.save(update_fields=['status', 'processed_at', 'payment'])
    
    def mark_failed(self, error_message=None):
        """Mark webhook as failed."""
        from django.utils import timezone
        self.status = 'failed'
        self.processed_at = timezone.now()
        if error_message:
            self.error_message = error_message
        self.save(update_fields=['status', 'processed_at', 'error_message'])