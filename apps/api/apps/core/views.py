"""
Core views for NOURX application.
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UserProfileSerializer


class CurrentUserView(APIView):
    """
    Get current user information.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class HealthCheckView(APIView):
    """
    Health check endpoint.
    """
    permission_classes = []
    
    def get(self, request):
        return Response({
            "status": "healthy",
            "message": "NOURX API is running"
        }, status=status.HTTP_200_OK)
