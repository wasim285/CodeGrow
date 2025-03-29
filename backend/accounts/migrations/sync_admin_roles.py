from django.db import migrations

def sync_admin_roles(apps, schema_editor):
    # Get the CustomUser model from the apps registry
    CustomUser = apps.get_model('accounts', 'CustomUser')
    
    # Update all superusers and staff to have the admin role
    CustomUser.objects.filter(
        is_staff=True
    ).update(role='admin')
    
    CustomUser.objects.filter(
        is_superuser=True
    ).update(role='admin')

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0014_remove_lessonfeedback_ai_feedback_and_more'),  # Updated to your last migrationur last migration
    ]

    operations = [
        migrations.RunPython(sync_admin_roles),
    ]