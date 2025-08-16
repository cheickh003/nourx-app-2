"""
URLs for tasks app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskCommentViewSet

# Create router
router = DefaultRouter(trailing_slash=False)
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-comments', TaskCommentViewSet, basename='taskcomment')

urlpatterns = [
    path('', include(router.urls)),
]
