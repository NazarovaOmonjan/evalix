import os
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = "Create or fix admin user"

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "admin")
        email = os.environ.get("ADMIN_EMAIL", "admin@evalix.com")
        password = os.environ.get("ADMIN_PASSWORD", "admin123")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )

        if created:
            user.set_password(password)

        # Always ensure admin role
        user.role = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Admin user '{username}' created."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Admin user '{username}' role fixed to admin."))
