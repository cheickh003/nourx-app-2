"""
Core views for NOURX application.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserProfileSerializer
from .permissions import IsAdminUser

# Models for stats aggregation
from apps.projects.models import Project
from apps.clients.models import Client
from apps.support.models import Ticket
from apps.billing.models import Invoice
from django.db.models import Sum
from django.conf import settings
from django.contrib.auth import get_user_model


class StaffUsersView(APIView):
    """
    View to list staff users (admins).
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        User = get_user_model()
        staff_users = User.objects.filter(profile__role='admin')
        serializer = UserProfileSerializer(staff_users, many=True)
        return Response(serializer.data)



from .models import Setting

class AppSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings_obj = {s.key: s.value for s in Setting.objects.all()}
        return Response(settings_obj)

    def post(self, request):
        for key, value in request.data.items():
            Setting.objects.update_or_create(key=key, defaults={'value': value})
        return Response(request.data)



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


class AdminDashboardStatsView(APIView):
    """
    Provides statistics for the admin dashboard.
    Accessible only by admin users.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """
        Return a dictionary of aggregated stats.
        """
        total_projects = Project.objects.count()
        total_clients = Client.objects.count()
        open_tickets = Ticket.objects.filter(status__iexact='open').count()
        
        # Assumes 'paid' is a valid status in the Invoice model.
        revenue_total = Invoice.objects.filter(status__iexact='paid').aggregate(total=Sum('total_ttc'))['total'] or 0

        stats = {
            'total_projects': total_projects,
            'total_clients': total_clients,
            'open_tickets': open_tickets,
            'revenue_total': revenue_total,
        }
        return Response(stats)
