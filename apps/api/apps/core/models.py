"""
Core models for NOURX application.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class BaseModel(models.Model):
    """
    Base abstract model with common fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class Profile(BaseModel):
    """
    User profile with role and additional information.
    """
    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("client", "Client"),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="client")
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    
    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"
