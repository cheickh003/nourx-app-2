"""
Admin configuration for billing app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Quote, QuoteItem, Invoice, InvoiceItem


class QuoteItemInline(admin.TabularInline):
    """
    Inline for managing quote items.
    """
    model = QuoteItem
    extra = 0
    fields = ['title', 'description', 'quantity', 'unit_price', 'total_price', 'order']
    readonly_fields = ['total_price']


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    """
    Admin interface for Quote model.
    """
    list_display = [
        'quote_number', 'title', 'client', 'status_display', 
        'total_ttc_display', 'valid_until', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'valid_until']
    search_fields = ['quote_number', 'title', 'client__name', 'description']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('quote_number', 'title', 'description', 'client', 'project', 'created_by')
        }),
        ('Statut', {
            'fields': ('status', 'valid_until')
        }),
        ('Dates', {
            'fields': ('sent_at', 'accepted_at')
        }),
        ('Montants', {
            'fields': ('subtotal_ht', 'tax_rate', 'tax_amount', 'total_ttc', 'currency')
        }),
        ('Conditions', {
            'fields': ('payment_terms', 'notes')
        }),
        ('PDF', {
            'fields': ('pdf_file', 'pdf_generated_at'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['client', 'project', 'created_by']
    readonly_fields = [
        'quote_number', 'subtotal_ht', 'tax_amount', 'total_ttc',
        'sent_at', 'accepted_at', 'pdf_generated_at', 'created_at', 'updated_at'
    ]
    inlines = [QuoteItemInline]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'draft': '#6c757d',
            'sent': '#007bff',
            'accepted': '#28a745',
            'rejected': '#dc3545',
            'expired': '#fd7e14',
            'cancelled': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def total_ttc_display(self, obj):
        """Display total with currency."""
        return format_html(
            '<strong>{:,.2f} {}</strong>',
            obj.total_ttc, obj.currency
        )
    total_ttc_display.short_description = 'Total TTC'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('client', 'project', 'created_by')


@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    """
    Admin interface for QuoteItem model.
    """
    list_display = ['title', 'quote', 'quantity', 'unit_price', 'total_price_display', 'order']
    list_filter = ['quote__status', 'created_at']
    search_fields = ['title', 'description', 'quote__quote_number']
    ordering = ['quote', 'order']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('quote', 'title', 'description')
        }),
        ('Prix', {
            'fields': ('quantity', 'unit_price', 'total_price', 'order')
        }),
    )
    
    autocomplete_fields = ['quote']
    readonly_fields = ['total_price', 'created_at', 'updated_at']
    
    def total_price_display(self, obj):
        """Display total price formatted."""
        return format_html(
            '<strong>{:,.2f} €</strong>',
            obj.total_price
        )
    total_price_display.short_description = 'Total HT'


class InvoiceItemInline(admin.TabularInline):
    """
    Inline for managing invoice items.
    """
    model = InvoiceItem
    extra = 0
    fields = ['title', 'description', 'quantity', 'unit_price', 'total_price', 'order']
    readonly_fields = ['total_price']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """
    Admin interface for Invoice model.
    """
    list_display = [
        'invoice_number', 'title', 'client', 'status_display',
        'total_ttc_display', 'paid_amount_display', 'remaining_amount_display',
        'due_date', 'is_overdue_display'
    ]
    list_filter = ['status', 'created_at', 'due_date']
    search_fields = ['invoice_number', 'title', 'client__name', 'external_reference']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('invoice_number', 'external_reference', 'title', 'description', 'client', 'project', 'quote', 'created_by')
        }),
        ('Statut', {
            'fields': ('status', 'due_date')
        }),
        ('Dates', {
            'fields': ('sent_at', 'paid_at')
        }),
        ('Montants', {
            'fields': ('subtotal_ht', 'tax_rate', 'tax_amount', 'total_ttc', 'paid_amount', 'currency')
        }),
        ('Conditions', {
            'fields': ('payment_terms', 'notes')
        }),
        ('PDF', {
            'fields': ('pdf_file', 'pdf_generated_at'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['client', 'project', 'quote', 'created_by']
    readonly_fields = [
        'invoice_number', 'subtotal_ht', 'tax_amount', 'total_ttc',
        'sent_at', 'paid_at', 'pdf_generated_at', 'created_at', 'updated_at'
    ]
    inlines = [InvoiceItemInline]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'draft': '#6c757d',
            'sent': '#007bff',
            'paid': '#28a745',
            'partially_paid': '#ffc107',
            'overdue': '#dc3545',
            'cancelled': '#6c757d',
            'refunded': '#fd7e14'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def total_ttc_display(self, obj):
        """Display total with currency."""
        return format_html(
            '<strong>{:,.2f} {}</strong>',
            obj.total_ttc, obj.currency
        )
    total_ttc_display.short_description = 'Total TTC'
    
    def paid_amount_display(self, obj):
        """Display paid amount with currency."""
        return format_html(
            '<span style="color: #28a745;">{:,.2f} {}</span>',
            obj.paid_amount, obj.currency
        )
    paid_amount_display.short_description = 'Montant payé'
    
    def remaining_amount_display(self, obj):
        """Display remaining amount with currency."""
        remaining = obj.remaining_amount
        color = '#28a745' if remaining == 0 else '#dc3545'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:,.2f} {}</span>',
            color, remaining, obj.currency
        )
    remaining_amount_display.short_description = 'Reste à payer'
    
    def is_overdue_display(self, obj):
        """Display overdue status with color."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">⚠️ En retard</span>'
            )
        return format_html(
            '<span style="color: #28a745;">✅ Dans les temps</span>'
        )
    is_overdue_display.short_description = 'État'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('client', 'project', 'quote', 'created_by')


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    """
    Admin interface for InvoiceItem model.
    """
    list_display = ['title', 'invoice', 'quantity', 'unit_price', 'total_price_display', 'order']
    list_filter = ['invoice__status', 'created_at']
    search_fields = ['title', 'description', 'invoice__invoice_number']
    ordering = ['invoice', 'order']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('invoice', 'title', 'description')
        }),
        ('Prix', {
            'fields': ('quantity', 'unit_price', 'total_price', 'order')
        }),
    )
    
    autocomplete_fields = ['invoice']
    readonly_fields = ['total_price', 'created_at', 'updated_at']
    
    def total_price_display(self, obj):
        """Display total price formatted."""
        return format_html(
            '<strong>{:,.2f} €</strong>',
            obj.total_price
        )
    total_price_display.short_description = 'Total HT'
