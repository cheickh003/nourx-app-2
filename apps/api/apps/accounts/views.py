"""
Authentication views for NOURX application.
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.core.serializers import UserProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    User login with session authentication.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to authenticate with username or email
    user = authenticate(username=username, password=password)
    if not user:
        # Try with email
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    
    if user and user.is_active:
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': UserProfileSerializer(user).data,
            'csrftoken': get_token(request)
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    """
    User logout.
    """
    logout(request)
    return Response({
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """
    Get CSRF token for forms.
    """
    return Response({
        'csrftoken': get_token(request)
    })
