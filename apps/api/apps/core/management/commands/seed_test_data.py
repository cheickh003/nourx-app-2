"""
Management command to seed test data for NOURX application.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random
from apps.core.models import Profile
from apps.clients.models import Client, ClientMember
from apps.projects.models import Project, Milestone
from apps.tasks.models import Task


class Command(BaseCommand):
    help = 'Seed test data for NOURX application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all data before seeding',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Resetting existing data...')
            Task.objects.all().delete()
            Milestone.objects.all().delete()
            Project.objects.all().delete()
            ClientMember.objects.all().delete()
            Client.objects.all().delete()
            Profile.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()

        self.stdout.write('Creating test data...')
        
        # Create NOURX admin users
        admin_user, created = User.objects.get_or_create(
            username='admin@nourx.com',
            defaults={
                'email': 'admin@nourx.com',
                'first_name': 'Admin',
                'last_name': 'NOURX',
                'is_staff': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            Profile.objects.create(user=admin_user, role='admin', phone='+33123456789')
            self.stdout.write(f'Created admin user: {admin_user.username}')

        # Create project manager
        pm_user, created = User.objects.get_or_create(
            username='pm@nourx.com',
            defaults={
                'email': 'pm@nourx.com',
                'first_name': 'Pierre',
                'last_name': 'Martin',
                'is_staff': True,
            }
        )
        if created:
            pm_user.set_password('pm123')
            pm_user.save()
            Profile.objects.create(user=pm_user, role='admin', phone='+33123456788')
            self.stdout.write(f'Created PM user: {pm_user.username}')

        # Create test clients
        clients_data = [
            {
                'name': 'TechCorp SARL',
                'email': 'contact@techcorp.fr',
                'main_contact_name': 'Marie Dubois',
                'main_contact_email': 'marie.dubois@techcorp.fr',
                'industry': 'Technologie',
                'company_size': '11-50',
                'status': 'active'
            },
            {
                'name': 'Design Studio',
                'email': 'hello@designstudio.fr',
                'main_contact_name': 'Jean Leroux',
                'main_contact_email': 'jean.leroux@designstudio.fr',
                'industry': 'Design',
                'company_size': '1-10',
                'status': 'active'
            },
            {
                'name': 'E-Commerce Plus',
                'email': 'contact@ecommerceplus.fr',
                'main_contact_name': 'Sophie Bernard',
                'main_contact_email': 'sophie.bernard@ecommerceplus.fr',
                'industry': 'E-commerce',
                'company_size': '51-200',
                'status': 'active'
            }
        ]

        clients = []
        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                email=client_data['email'],
                defaults=client_data
            )
            clients.append(client)
            if created:
                self.stdout.write(f'Created client: {client.name}')

        # Create client users
        client_users_data = [
            {
                'username': 'marie.dubois@techcorp.fr',
                'email': 'marie.dubois@techcorp.fr',
                'first_name': 'Marie',
                'last_name': 'Dubois',
                'client_idx': 0
            },
            {
                'username': 'jean.leroux@designstudio.fr',
                'email': 'jean.leroux@designstudio.fr',
                'first_name': 'Jean',
                'last_name': 'Leroux',
                'client_idx': 1
            },
            {
                'username': 'sophie.bernard@ecommerceplus.fr',
                'email': 'sophie.bernard@ecommerceplus.fr',
                'first_name': 'Sophie',
                'last_name': 'Bernard',
                'client_idx': 2
            },
            {
                'username': 'assistant@techcorp.fr',
                'email': 'assistant@techcorp.fr',
                'first_name': 'Thomas',
                'last_name': 'Petit',
                'client_idx': 0  # Same client as Marie
            }
        ]

        client_users = []
        for user_data in client_users_data:
            client_idx = user_data.pop('client_idx')
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                user.set_password('client123')
                user.save()
                Profile.objects.create(user=user, role='client')
                
                # Create client membership
                role = 'owner' if 'marie' in user.username or 'jean' in user.username or 'sophie' in user.username else 'member'
                ClientMember.objects.create(
                    user=user,
                    client=clients[client_idx],
                    role=role,
                    can_view_billing=True if role == 'owner' else False
                )
                client_users.append(user)
                self.stdout.write(f'Created client user: {user.username} for {clients[client_idx].name}')

        # Create projects
        projects_data = [
            {
                'title': 'Refonte Site Web TechCorp',
                'description': 'Refonte complète du site web corporate avec nouveau design et CMS moderne',
                'status': 'active',
                'priority': 'high',
                'progress': 65,
                'estimated_hours': 120,
                'actual_hours': 78,
                'client_idx': 0
            },
            {
                'title': 'Application Mobile Design Studio',
                'description': 'Développement d\'une app mobile pour présenter les projets',
                'status': 'active',
                'priority': 'normal',
                'progress': 30,
                'estimated_hours': 80,
                'actual_hours': 24,
                'client_idx': 1
            },
            {
                'title': 'Plateforme E-commerce',
                'description': 'Création d\'une plateforme e-commerce sur mesure avec gestion multi-vendeurs',
                'status': 'active',
                'priority': 'urgent',
                'progress': 85,
                'estimated_hours': 200,
                'actual_hours': 170,
                'client_idx': 2
            },
            {
                'title': 'Système de Gestion Interne',
                'description': 'Outil interne de gestion des projets pour TechCorp',
                'status': 'on_hold',
                'priority': 'low',
                'progress': 15,
                'estimated_hours': 60,
                'actual_hours': 9,
                'client_idx': 0
            }
        ]

        projects = []
        for proj_data in projects_data:
            client_idx = proj_data.pop('client_idx')
            start_date = timezone.now().date() - timedelta(days=random.randint(30, 90))
            end_date = start_date + timedelta(days=random.randint(60, 120))
            
            project, created = Project.objects.get_or_create(
                title=proj_data['title'],
                defaults={
                    **proj_data,
                    'client': clients[client_idx],
                    'project_manager': pm_user,
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
            
            if created:
                # Add team members
                project.team_members.add(pm_user)
                if random.choice([True, False]):
                    project.team_members.add(admin_user)
                
                projects.append(project)
                self.stdout.write(f'Created project: {project.title}')

        # Create milestones
        milestones_data = [
            {'title': 'Analyse des besoins', 'days_from_start': 7, 'status': 'completed', 'progress': 100},
            {'title': 'Design et maquettes', 'days_from_start': 21, 'status': 'completed', 'progress': 100},
            {'title': 'Développement Phase 1', 'days_from_start': 45, 'status': 'in_progress', 'progress': 70},
            {'title': 'Tests et validation', 'days_from_start': 60, 'status': 'pending', 'progress': 0},
            {'title': 'Mise en production', 'days_from_start': 75, 'status': 'pending', 'progress': 0},
        ]

        for project in projects[:2]:  # Only for first 2 projects
            for i, milestone_data in enumerate(milestones_data):
                due_date = project.start_date + timedelta(days=milestone_data['days_from_start'])
                
                milestone, created = Milestone.objects.get_or_create(
                    project=project,
                    title=milestone_data['title'],
                    defaults={
                        'due_date': due_date,
                        'status': milestone_data['status'],
                        'progress': milestone_data['progress'],
                        'order': i + 1
                    }
                )
                if created:
                    self.stdout.write(f'Created milestone: {milestone.title} for {project.title}')

        # Create tasks
        task_templates = [
            {'title': 'Analyse des besoins client', 'type': 'task', 'status': 'done', 'priority': 'normal'},
            {'title': 'Création des wireframes', 'type': 'feature', 'status': 'done', 'priority': 'high'},
            {'title': 'Développement de l\'interface utilisateur', 'type': 'feature', 'status': 'in_progress', 'priority': 'high'},
            {'title': 'Intégration API backend', 'type': 'feature', 'status': 'in_progress', 'priority': 'normal'},
            {'title': 'Correction bug responsive mobile', 'type': 'bug', 'status': 'todo', 'priority': 'urgent'},
            {'title': 'Tests unitaires', 'type': 'testing', 'status': 'todo', 'priority': 'normal'},
            {'title': 'Documentation technique', 'type': 'documentation', 'status': 'todo', 'priority': 'low'},
            {'title': 'Optimisation performances', 'type': 'improvement', 'status': 'review', 'priority': 'normal'},
            {'title': 'Validation du design avec client', 'type': 'task', 'status': 'blocked', 'priority': 'high'},
            {'title': 'Formation utilisateurs', 'type': 'task', 'status': 'todo', 'priority': 'low'},
        ]

        for project in projects:
            # Create 5-8 tasks per project
            num_tasks = random.randint(5, 8)
            selected_templates = random.sample(task_templates, num_tasks)
            
            for i, task_template in enumerate(selected_templates):
                due_date = None
                if random.choice([True, False]):
                    due_date = timezone.now().date() + timedelta(days=random.randint(-5, 30))
                
                # Assign to random team member or client
                assigned_to = None
                if random.choice([True, False]):
                    if random.choice([True, True, False]):  # 66% chance team member, 33% client
                        assigned_to = random.choice([pm_user, admin_user])
                    else:
                        # Find a client user for this project
                        client_members = ClientMember.objects.filter(client=project.client)
                        if client_members:
                            assigned_to = random.choice(client_members).user
                
                task, created = Task.objects.get_or_create(
                    project=project,
                    title=f"{task_template['title']} - {project.title[:20]}",
                    defaults={
                        'description': f"Tâche pour le projet {project.title}",
                        'status': task_template['status'],
                        'priority': task_template['priority'],
                        'task_type': task_template['type'],
                        'progress': random.randint(0, 100) if task_template['status'] == 'in_progress' else (100 if task_template['status'] == 'done' else 0),
                        'due_date': due_date,
                        'estimated_hours': random.randint(2, 20),
                        'order': i + 1,
                        'assigned_to': assigned_to,
                        'created_by': pm_user
                    }
                )
                if created:
                    self.stdout.write(f'Created task: {task.title[:50]}...')

        self.stdout.write(
            self.style.SUCCESS('✅ Test data seeded successfully!')
        )
        
        self.stdout.write('\n📊 Summary:')
        self.stdout.write(f'- Users: {User.objects.count()}')
        self.stdout.write(f'- Clients: {Client.objects.count()}')
        self.stdout.write(f'- Projects: {Project.objects.count()}')
        self.stdout.write(f'- Milestones: {Milestone.objects.count()}')
        self.stdout.write(f'- Tasks: {Task.objects.count()}')
        
        self.stdout.write('\n🔐 Test credentials:')
        self.stdout.write('Admin: admin@nourx.com / admin123')
        self.stdout.write('PM: pm@nourx.com / pm123')
        self.stdout.write('Client TechCorp: marie.dubois@techcorp.fr / client123')
        self.stdout.write('Client Design Studio: jean.leroux@designstudio.fr / client123')
        self.stdout.write('Client E-commerce: sophie.bernard@ecommerceplus.fr / client123')
        self.stdout.write('Assistant TechCorp: assistant@techcorp.fr / client123')
