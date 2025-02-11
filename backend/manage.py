#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

    # ✅ Auto-create superuser during deployment
    if os.getenv("CREATE_SUPERUSER") == "True":
        try:
            import django
            django.setup()

            from django.contrib.auth import get_user_model
            User = get_user_model()

            username = os.getenv("DJANGO_SUPERUSER_USERNAME")
            email = os.getenv("DJANGO_SUPERUSER_EMAIL")
            password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

            if username and email and password:
                if not User.objects.filter(username=username).exists():
                    print(f"✅ Creating superuser: {username}")
                    User.objects.create_superuser(username, email, password)
                else:
                    print("✅ Superuser already exists, skipping creation.")
            else:
                print("❌ Missing superuser credentials in environment variables.")

        except Exception as e:
            print(f"❌ Failed to create superuser: {e}")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
