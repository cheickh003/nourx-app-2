"""
URLs for payments app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InitPaymentView, WebhookView, CheckPaymentView, PaymentViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    # Explicit endpoints under /api/payments/
    path("payments/init/", InitPaymentView.as_view(), name="payment-init"),
    path("payments/webhook/", WebhookView.as_view(), name="payment-webhook"),
    path("payments/check/", CheckPaymentView.as_view(), name="payment-check"),
    # REST list/retrieve under /api/payments
    path('', include(router.urls)),
]
