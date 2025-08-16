
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.clients.models import Client, ClientMember
from apps.core.models import Profile
from apps.core.serializers import UserProfileSerializer
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

User = get_user_model()

class ClientUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(write_only=True)
    client_id = serializers.UUIDField()

    def validate_client_id(self, value):
        if not Client.objects.filter(id=value).exists():
            raise serializers.ValidationError("Client non trouvé.")
        return value

    def validate_email(self, value):
        # Ensure email/username uniqueness
        if User.objects.filter(username__iexact=value).exists() or User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            client = Client.objects.get(id=validated_data['client_id'])
            
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password']
            )

            Profile.objects.create(user=user, role='client')
            ClientMember.objects.create(user=user, client=client)

            # Send set-password email (dev via MailHog)
            try:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                link = f"{settings.FRONTEND_BASE_URL}/set-password?uid={uid}&token={token}"
                subject = "Créez votre mot de passe NOURX"
                message = (
                    f"Bonjour {user.first_name},\n\n"
                    f"Un compte a été créé pour vous chez {client.name}.\n"
                    f"Veuillez définir votre mot de passe en suivant ce lien: {link}\n\n"
                    f"Ceci est un email automatique."
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
            except Exception:
                pass

            return user

    def to_representation(self, instance):
        # Represent created user with profile info, not input fields
        return UserProfileSerializer(instance).data
