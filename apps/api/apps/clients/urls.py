"""
URLs for clients app (admin only).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ClientMemberViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'client-members', ClientMemberViewSet, basename='clientmember')

urlpatterns = [
    path('', include(router.urls)),
]
