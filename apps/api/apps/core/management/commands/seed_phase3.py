from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project, Milestone
from apps.tasks.models import Task
from apps.billing.models import Invoice, InvoiceItem
import boto3


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

        # Ensure S3 bucket exists and upload a sample document
        try:
            import os
            import uuid as _uuid
            s3 = boto3.client(
                's3',
                endpoint_url=os.environ.get('AWS_S3_ENDPOINT_URL'),
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
                region_name=os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
            )
            bucket = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'nourx-bucket')
            # create bucket if missing (MinIO ignores if exists)
            try:
                s3.create_bucket(Bucket=bucket)
            except Exception:
                pass
            key = f"projects/{project1.id}/documents/{_uuid.uuid4()}/bienvenue.txt"
            s3.put_object(Bucket=bucket, Key=key, Body=b"Bienvenue sur NOURX", ContentType="text/plain")
            # Create a Document record bound to uploaded object
            from apps.documents.models import Document
            doc, _ = Document.objects.get_or_create(
                project=project1,
                file_name="bienvenue.txt",
                defaults={
                    'title': 'Bienvenue',
                    'description': 'Guide de démarrage',
                    'file_size': 20,
                    'mime_type': 'text/plain',
                    's3_bucket': bucket,
                    's3_key': key,
                    'visibility': 'public',
                }
            )
            if not doc.file:
                doc.file.name = key
                doc.save()
        except Exception:
            pass

        # Create a sample invoice for Client A
        inv, _ = Invoice.objects.get_or_create(
            client=client_a,
            project=project1,
            title="Acompte projet",
            defaults={
                'description': 'Acompte initial',
                'status': 'sent',
                'currency': 'EUR',
                'payment_terms': 'Paiement à 30 jours',
                'due_date': timezone.now().date(),
            }
        )
        InvoiceItem.objects.get_or_create(
            invoice=inv,
            order=1,
            defaults={
                'title': 'Acompte',
                'description': 'Démarrage du projet',
                'quantity': 1,
                'unit_price': 500.00,
            }
        )

        self.stdout.write(self.style.SUCCESS("✅ Phase 3 demo data seeded."))
