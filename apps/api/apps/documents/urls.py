"""
URLs for documents app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, DocumentFolderViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-folders', DocumentFolderViewSet, basename='documentfolder')

urlpatterns = [
    path('', include(router.urls)),
]
