"""
Models for billing app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models import BaseModel


class Quote(BaseModel):
    """
    Quote/Devis model.
    """
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("sent", "Envoyé"),
        ("accepted", "Accepté"),
        ("rejected", "Rejeté"),
        ("expired", "Expiré"),
        ("cancelled", "Annulé"),
    ]
    
    # Relations
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="quotes",
        verbose_name="Client"
    )
    
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="quotes",
        verbose_name="Projet"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_quotes",
        verbose_name="Créé par"
    )
    
    # Numérotation
    quote_number = models.CharField(max_length=50, unique=True, verbose_name="Numéro de devis")
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre du devis")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Status
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="draft",
        verbose_name="Statut"
    )
    
    # Dates
    quote_date = models.DateField(auto_now_add=True, verbose_name="Date du devis")
    valid_until = models.DateField(verbose_name="Valide jusqu'au")
    sent_at = models.DateTimeField(blank=True, null=True, verbose_name="Envoyé le")
    accepted_at = models.DateTimeField(blank=True, null=True, verbose_name="Accepté le")
    
    # Montants
    subtotal_ht = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Sous-total HT"
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('20.00'),
        verbose_name="Taux TVA (%)"
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Montant TVA"
    )
    total_ttc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Total TTC"
    )
    
    # Devise
    currency = models.CharField(max_length=3, default="EUR", verbose_name="Devise")
    
    # Conditions
    payment_terms = models.TextField(
        blank=True,
        null=True,
        default="Paiement à 30 jours",
        verbose_name="Conditions de paiement"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    # PDF généré
    pdf_file = models.FileField(
        upload_to="quotes/pdf/",
        blank=True,
        null=True,
        verbose_name="Fichier PDF"
    )
    pdf_generated_at = models.DateTimeField(blank=True, null=True, verbose_name="PDF généré le")
    
    class Meta:
        verbose_name = "Devis"
        verbose_name_plural = "Devis"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['quote_number']),
            models.Index(fields=['valid_until']),
        ]
    
    def __str__(self):
        return f"Devis {self.quote_number} - {self.client.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate quote number if not provided
        if not self.quote_number:
            from django.utils import timezone
            year = timezone.now().year
            count = Quote.objects.filter(created_at__year=year).count() + 1
            self.quote_number = f"DV-{year}-{count:04d}"
        
        # Calculate totals
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Calculate quote totals."""
        self.subtotal_ht = sum(item.total_price for item in self.items.all())
        self.tax_amount = self.subtotal_ht * (self.tax_rate / 100)
        self.total_ttc = self.subtotal_ht + self.tax_amount


class QuoteItem(BaseModel):
    """
    Quote line item.
    """
    # Relations
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Devis"
    )
    
    # Informations
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Quantité et prix
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Quantité"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Prix unitaire HT"
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Prix total HT"
    )
    
    # Ordre
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    class Meta:
        verbose_name = "Ligne de devis"
        verbose_name_plural = "Lignes de devis"
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Update quote totals
        self.quote.calculate_totals()
        self.quote.save()
    
    def __str__(self):
        return f"{self.title} - {self.quote.quote_number}"


class Invoice(BaseModel):
    """
    Invoice/Facture model.
    """
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("sent", "Envoyée"),
        ("paid", "Payée"),
        ("partially_paid", "Partiellement payée"),
        ("overdue", "En retard"),
        ("cancelled", "Annulée"),
        ("refunded", "Remboursée"),
    ]
    
    # Relations
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="invoices",
        verbose_name="Client"
    )
    
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="invoices",
        verbose_name="Projet"
    )
    
    quote = models.ForeignKey(
        Quote,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="invoices",
        verbose_name="Devis associé"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_invoices",
        verbose_name="Créé par"
    )
    
    # Numérotation
    invoice_number = models.CharField(max_length=50, unique=True, verbose_name="Numéro de facture")
    external_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Référence externe"
    )
    
    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre de la facture")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
        verbose_name="Statut"
    )
    
    # Dates
    invoice_date = models.DateField(auto_now_add=True, verbose_name="Date de facture")
    due_date = models.DateField(verbose_name="Date d'échéance")
    sent_at = models.DateTimeField(blank=True, null=True, verbose_name="Envoyée le")
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name="Payée le")
    
    # Montants
    subtotal_ht = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Sous-total HT"
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('20.00'),
        verbose_name="Taux TVA (%)"
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Montant TVA"
    )
    total_ttc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Total TTC"
    )
    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Montant payé"
    )
    
    # Devise
    currency = models.CharField(max_length=3, default="EUR", verbose_name="Devise")
    
    # Conditions
    payment_terms = models.TextField(
        blank=True,
        null=True,
        default="Paiement à 30 jours",
        verbose_name="Conditions de paiement"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    # PDF généré
    pdf_file = models.FileField(
        upload_to="invoices/pdf/",
        blank=True,
        null=True,
        verbose_name="Fichier PDF"
    )
    pdf_generated_at = models.DateTimeField(blank=True, null=True, verbose_name="PDF généré le")
    
    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['due_date']),
            models.Index(fields=['external_reference']),
        ]
    
    def __str__(self):
        return f"Facture {self.invoice_number} - {self.client.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate invoice number if not provided
        if not self.invoice_number:
            from django.utils import timezone
            year = timezone.now().year
            count = Invoice.objects.filter(created_at__year=year).count() + 1
            self.invoice_number = f"FA-{year}-{count:04d}"
        
        # Calculate totals
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Calculate invoice totals."""
        self.subtotal_ht = sum(item.total_price for item in self.items.all())
        self.tax_amount = self.subtotal_ht * (self.tax_rate / 100)
        self.total_ttc = self.subtotal_ht + self.tax_amount
    
    @property
    def remaining_amount(self):
        """Calculate remaining amount to be paid."""
        return self.total_ttc - self.paid_amount
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue."""
        from django.utils import timezone
        return (
            self.due_date < timezone.now().date() and
            self.status not in ['paid', 'cancelled', 'refunded']
        )


class InvoiceItem(BaseModel):
    """
    Invoice line item.
    """
    # Relations
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Facture"
    )
    
    # Informations
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # Quantité et prix
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Quantité"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Prix unitaire HT"
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Prix total HT"
    )
    
    # Ordre
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    
    class Meta:
        verbose_name = "Ligne de facture"
        verbose_name_plural = "Lignes de facture"
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Update invoice totals
        self.invoice.calculate_totals()
        self.invoice.save()
    
    def __str__(self):
        return f"{self.title} - {self.invoice.invoice_number}"