"""
Authentication views for NOURX application.
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from apps.core.permissions import IsNourxStaff
from rest_framework.response import Response
from rest_framework import generics
from apps.core.serializers import UserProfileSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import ClientUserCreateSerializer



@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
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


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
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


@method_decorator(csrf_exempt, name='dispatch')
class ClientUserCreateView(generics.CreateAPIView):
    """Create a new client user (admin-only)."""
    serializer_class = ClientUserCreateSerializer
    permission_classes = [IsNourxStaff]


@api_view(['POST'])
@permission_classes([AllowAny])
def set_password_view(request):
    """
    Set a new password using a uid/token pair (no auth required).
    Expected payload: { uid: string, token: string, password: string }
    """
    from django.contrib.auth import get_user_model
    from django.utils.http import urlsafe_base64_decode
    from django.contrib.auth.tokens import default_token_generator
    from rest_framework import status

    uid = request.data.get('uid')
    token = request.data.get('token')
    password = request.data.get('password')

    if not uid or not token or not password:
        return Response({"detail": "uid, token et password sont requis."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid_int = urlsafe_base64_decode(uid).decode()
        User = get_user_model()
        user = User.objects.get(pk=uid_int)
    except Exception:
        return Response({"detail": "Identifiant invalide."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "Jeton invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

    # Basic validation
    if len(password) < 8:
        return Response({"password": ["Le mot de passe doit contenir au moins 8 caractères."]}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()
    return Response({"detail": "Mot de passe défini avec succès."}, status=status.HTTP_200_OK)


@api_view(['POST'])
def reset_password_view(request):
    """
    Send a password reset link to a user by id or email.
    Body: { user_id?: number, email?: string }
    """
    from django.contrib.auth import get_user_model
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from django.core.mail import send_mail
    from django.conf import settings

    user_id = request.data.get('user_id')
    email = request.data.get('email')
    User = get_user_model()
    user = None

    if user_id:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    elif email:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({"detail": "user_id ou email requis."}, status=status.HTTP_400_BAD_REQUEST)

    # Permission: admin-only
    if not (request.user.is_superuser or request.user.is_staff or (hasattr(request.user, 'profile') and getattr(request.user.profile, 'role', None) == 'admin')):
        return Response({"detail": "Vous n'avez pas les permissions pour effectuer cette action."}, status=status.HTTP_403_FORBIDDEN)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_BASE_URL}/set-password?uid={uid}&token={token}"
    subject = "Réinitialisation de mot de passe NOURX"
    message = (
        f"Bonjour {user.first_name},\n\n"
        f"Utilisez ce lien pour définir un nouveau mot de passe: {link}\n\n"
        f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
    return Response({"detail": "Email de réinitialisation envoyé."}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
def update_user_status_view(request, user_id: int):
    """
    Enable/disable a user account. Body: { is_active: boolean }
    """
    from django.contrib.auth import get_user_model
    from rest_framework import status

    is_active = request.data.get('is_active')
    if is_active is None:
        return Response({"detail": "is_active requis."}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Permission: admin-only
    if not (request.user.is_superuser or request.user.is_staff or (hasattr(request.user, 'profile') and getattr(request.user.profile, 'role', None) == 'admin')):
        return Response({"detail": "Vous n'avez pas les permissions pour effectuer cette action."}, status=status.HTTP_403_FORBIDDEN)

    user.is_active = bool(is_active)
    user.save()
    return Response({"detail": "Statut mis à jour."})
