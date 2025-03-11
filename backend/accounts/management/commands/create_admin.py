from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Create a superuser if none exists"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@example.com",
                password="adminpassword"
            )
            self.stdout.write(self.style.SUCCESS("Superuser created successfully!"))
        else:
            self.stdout.write(self.style.WARNING("Superuser already exists."))
