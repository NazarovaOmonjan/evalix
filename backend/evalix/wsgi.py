import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "evalix.settings")
application = get_wsgi_application()

# Run migrations on startup (for platforms where build.sh may not run properly)
try:
    from django.core.management import call_command
    call_command("migrate", "--no-input")
    call_command("create_admin")
except Exception as e:
    print(f"Startup command error (non-fatal): {e}")
