from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project, Milestone
from apps.tasks.models import Task


class Command(BaseCommand):
    help = "Seed demo data for Phase 3 (Client/Projects/Tasks)"

    def handle(self, *args, **options):
        # Create or get demo user
        user, _ = User.objects.get_or_create(
            username="clientuser",
            defaults={
                "email": "client@example.com",
                "first_name": "Client",
                "last_name": "User",
            },
        )
        user.set_password("testpass123")
        user.is_staff = False
        user.save()

        # Create or get staff user
        staff, _ = User.objects.get_or_create(
            username="staff",
            defaults={
                "email": "staff@example.com",
                "first_name": "Staff",
                "last_name": "User",
                "is_staff": True,
            },
        )
        staff.set_password("testpass123")
        staff.is_staff = True
        staff.save()

        # Create two clients
        client_a, _ = Client.objects.get_or_create(
            name="Client A",
            defaults={
                "email": "contact@clienta.test",
                "main_contact_name": "Alice",
                "main_contact_email": "alice@clienta.test",
                "status": "active",
            },
        )
        client_b, _ = Client.objects.get_or_create(
            name="Client B",
            defaults={
                "email": "contact@clientb.test",
                "main_contact_name": "Bob",
                "main_contact_email": "bob@clientb.test",
                "status": "active",
            },
        )

        # Membership for user in Client A only
        ClientMember.objects.get_or_create(user=user, client=client_a, defaults={"role": "admin"})

        # Create projects
        project1, _ = Project.objects.get_or_create(
            client=client_a,
            title="Site Web NOURX",
            defaults={
                "description": "Refonte du site",
                "status": "active",
                "priority": "normal",
                "progress": 35,
                "project_manager": staff,
            },
        )
        project2, _ = Project.objects.get_or_create(
            client=client_b,
            title="App Mobile",
            defaults={
                "description": "MVP iOS/Android",
                "status": "active",
                "priority": "high",
                "progress": 20,
                "project_manager": staff,
            },
        )

        # Milestones for project1
        from datetime import timedelta
        Milestone.objects.get_or_create(
            project=project1,
            order=1,
            defaults={
                "title": "Design",
                "status": "in_progress",
                "progress": 60,
                "due_date": (timezone.now() + timedelta(days=7)).date(),
            },
        )

        # Tasks for project1 (visible to clientuser)
        Task.objects.get_or_create(
            project=project1,
            title="Maquettage",
            defaults={
                "description": "Pages principales",
                "status": "in_progress",
                "priority": "normal",
                "assigned_to": user,
                "created_by": staff,
                "progress": 40,
                "order": 1,
            },
        )
        Task.objects.get_or_create(
            project=project1,
            title="Intégration",
            defaults={
                "status": "todo",
                "priority": "high",
                "created_by": staff,
                "order": 2,
            },
        )

        # Tasks for project2 (should be hidden from clientuser)
        Task.objects.get_or_create(
            project=project2,
            title="Auth",
            defaults={
                "status": "todo",
                "priority": "normal",
                "created_by": staff,
                "order": 1,
            },
        )

        self.stdout.write(self.style.SUCCESS("✅ Phase 3 demo data seeded."))
