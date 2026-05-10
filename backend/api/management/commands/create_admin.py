import os
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = "Create admin user if it doesn't exist"

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "admin")
        email = os.environ.get("ADMIN_EMAIL", "admin@evalix.com")
        password = os.environ.get("ADMIN_PASSWORD", "admin123")

        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            user.role = "admin"
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user '{username}' created."))
        else:
            self.stdout.write(self.style.WARNING(f"Admin user '{username}' already exists."))
