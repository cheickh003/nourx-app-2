"""
Admin configuration for payments app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import json
from .models import Payment, PaymentAttempt, PaymentWebhook


class PaymentAttemptInline(admin.TabularInline):
    """
    Inline for payment attempts.
    """
    model = PaymentAttempt
    extra = 0
    fields = ['attempt_number', 'status', 'attempted_amount', 'channel', 'error_code', 'duration_seconds']
    readonly_fields = ['duration_seconds', 'started_at', 'completed_at']


class PaymentWebhookInline(admin.TabularInline):
    """
    Inline for payment webhooks.
    """
    model = PaymentWebhook
    extra = 0
    fields = ['event_type', 'status', 'is_signature_valid', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin interface for Payment model.
    """
    list_display = [
        'cinetpay_transaction_id', 'invoice', 'client', 'status_display',
        'amount_display', 'payment_method', 'initiated_at', 'completed_at'
    ]
    list_filter = [
        'status', 'payment_method', 'currency', 'initiated_at', 'completed_at'
    ]
    search_fields = [
        'cinetpay_transaction_id', 'external_reference', 
        'invoice__invoice_number', 'client__name', 'payer_email'
    ]
    ordering = ['-initiated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('invoice', 'client', 'initiated_by')
        }),
        ('CinetPay', {
            'fields': ('cinetpay_transaction_id', 'cinetpay_payment_token', 'cinetpay_checkout_url')
        }),
        ('Montant et méthode', {
            'fields': ('amount', 'currency', 'payment_method', 'status')
        }),
        ('Dates', {
            'fields': ('initiated_at', 'processed_at', 'completed_at', 'expires_at')
        }),
        ('Informations du payeur', {
            'fields': ('payer_name', 'payer_email', 'payer_phone')
        }),
        ('Frais', {
            'fields': ('fees_amount', 'net_amount')
        }),
        ('Références', {
            'fields': ('external_reference', 'description')
        }),
        ('Métadonnées techniques', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Données brutes', {
            'fields': ('raw_response_data_display', 'webhook_payload_display'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['invoice', 'client', 'initiated_by']
    readonly_fields = [
        'initiated_at', 'processed_at', 'completed_at', 'net_amount',
        'raw_response_data_display', 'webhook_payload_display'
    ]
    inlines = [PaymentAttemptInline, PaymentWebhookInline]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'pending': '#ffc107',
            'processing': '#007bff',
            'completed': '#28a745',
            'failed': '#dc3545',
            'cancelled': '#6c757d',
            'refunded': '#fd7e14',
            'disputed': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def amount_display(self, obj):
        """Display amount with currency."""
        return format_html(
            '<strong>{:,.2f} {}</strong>',
            obj.amount, obj.currency
        )
    amount_display.short_description = 'Montant'
    
    def raw_response_data_display(self, obj):
        """Display formatted JSON data."""
        if obj.raw_response_data:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.raw_response_data, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    raw_response_data_display.short_description = 'Données de réponse'
    
    def webhook_payload_display(self, obj):
        """Display formatted JSON payload."""
        if obj.webhook_payload:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.webhook_payload, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    webhook_payload_display.short_description = 'Payload webhook'
    
    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related('invoice', 'client', 'initiated_by')


@admin.register(PaymentAttempt)
class PaymentAttemptAdmin(admin.ModelAdmin):
    """
    Admin interface for PaymentAttempt model.
    """
    list_display = [
        'transaction_id', 'payment', 'attempt_number', 'status_display',
        'attempted_amount_display', 'channel', 'duration_display', 'started_at'
    ]
    list_filter = ['status', 'channel', 'started_at']
    search_fields = ['transaction_id', 'payment__cinetpay_transaction_id', 'error_code']
    ordering = ['-started_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('payment', 'invoice', 'transaction_id', 'attempt_number')
        }),
        ('Status et canal', {
            'fields': ('status', 'channel', 'attempted_amount')
        }),
        ('Dates', {
            'fields': ('started_at', 'completed_at', 'duration_seconds')
        }),
        ('Erreurs', {
            'fields': ('error_code', 'error_message')
        }),
        ('Métadonnées techniques', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Données brutes', {
            'fields': ('request_data_display', 'response_data_display'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['payment', 'invoice']
    readonly_fields = [
        'started_at', 'completed_at', 'duration_seconds',
        'request_data_display', 'response_data_display'
    ]
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'initiated': '#007bff',
            'redirected': '#17a2b8',
            'processing': '#ffc107',
            'completed': '#28a745',
            'failed': '#dc3545',
            'abandoned': '#6c757d',
            'expired': '#fd7e14'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def attempted_amount_display(self, obj):
        """Display attempted amount."""
        return format_html(
            '{:,.2f} €',
            obj.attempted_amount
        )
    attempted_amount_display.short_description = 'Montant tenté'
    
    def duration_display(self, obj):
        """Display duration in human readable format."""
        if obj.duration_seconds:
            if obj.duration_seconds < 60:
                return f"{obj.duration_seconds}s"
            else:
                minutes = obj.duration_seconds // 60
                seconds = obj.duration_seconds % 60
                return f"{minutes}m {seconds}s"
        return "-"
    duration_display.short_description = 'Durée'
    
    def request_data_display(self, obj):
        """Display formatted JSON request data."""
        if obj.request_data:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.request_data, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    request_data_display.short_description = 'Données de requête'
    
    def response_data_display(self, obj):
        """Display formatted JSON response data."""
        if obj.response_data:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.response_data, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    response_data_display.short_description = 'Données de réponse'


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    """
    Admin interface for PaymentWebhook model.
    """
    list_display = [
        'transaction_id', 'event_type', 'status_display', 'is_signature_valid_display',
        'payment', 'created_at'
    ]
    list_filter = ['status', 'event_type', 'is_signature_valid', 'created_at']
    search_fields = ['transaction_id', 'webhook_id', 'payment__cinetpay_transaction_id']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('transaction_id', 'webhook_id', 'event_type', 'payment')
        }),
        ('Status', {
            'fields': ('status', 'processed_at', 'is_signature_valid', 'signature')
        }),
        ('Métadonnées', {
            'fields': ('ip_address', 'error_message')
        }),
        ('Données', {
            'fields': ('payload_display', 'headers_display'),
            'classes': ('collapse',)
        }),
    )
    
    autocomplete_fields = ['payment']
    readonly_fields = ['processed_at', 'payload_display', 'headers_display']
    
    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            'received': '#007bff',
            'processed': '#28a745',
            'ignored': '#6c757d',
            'failed': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def is_signature_valid_display(self, obj):
        """Display signature validity with icon."""
        if obj.is_signature_valid:
            return format_html(
                '<span style="color: #28a745;">✅ Valide</span>'
            )
        return format_html(
            '<span style="color: #dc3545;">❌ Invalide</span>'
        )
    is_signature_valid_display.short_description = 'Signature'
    
    def payload_display(self, obj):
        """Display formatted JSON payload."""
        if obj.payload:
            return format_html(
                '<pre style="max-height: 300px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.payload, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    payload_display.short_description = 'Payload'
    
    def headers_display(self, obj):
        """Display formatted JSON headers."""
        if obj.headers:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll;">{}</pre>',
                json.dumps(obj.headers, indent=2, ensure_ascii=False)
            )
        return "Aucune données"
    headers_display.short_description = 'En-têtes HTTP'
