from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('clients', '0001_initial'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='clientmember',
            name='clients_cli_role_71f673_idx',
        ),
        migrations.RemoveField(
            model_name='clientmember',
            name='role',
        ),
        migrations.RemoveField(
            model_name='clientmember',
            name='can_view_billing',
        ),
        migrations.RemoveField(
            model_name='clientmember',
            name='can_manage_team',
        ),
    ]

