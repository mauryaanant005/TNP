#!/bin/sh

set -e

# ENV=DEV uses SQLite (see t_and_p_automation/settings.py) - there's no
# MySQL to wait for in that mode.
if [ "${ENV:-PROD}" != "DEV" ]; then
  echo "Waiting for MySQL to be ready..."

  python << END
import os
import sys
import time
import socket

# TCET IT provisions a managed MySQL instance; the host/port are injected
# at deploy time rather than being a "mysql" service in docker-compose.
db_host = os.environ.get("DATABASE_HOST", "mysql")
db_port = int(os.environ.get("DATABASE_PORT", "3306"))

start_time = time.time()
while True:
    try:
        with socket.create_connection((db_host, db_port), timeout=1):
            break
    except OSError:
        # Limit the wait time to 30 seconds
        if time.time() - start_time > 30:
             sys.exit(1)
        time.sleep(1)
END

  echo "MySQL is up - executing command"
fi

# Only the api service should run migrations/superuser bootstrap - the
# celery service shares this same entrypoint/image but sets
# RUN_RELEASE_TASKS=0 to avoid two containers racing to migrate the same
# database on a cold start.
if [ "${RUN_RELEASE_TASKS:-1}" = "1" ]; then
  echo "Running database migrations..."
  python manage.py migrate --noinput

  echo "Creating superuser..."
  python manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model

email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

if not email or not password:
    print("DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD not set - skipping superuser creation.")
else:
    User = get_user_model()
    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(email, password)
        print("Superuser created.")
    else:
        print("Superuser already exists.")
PYEOF
fi

echo "Starting: $@"
exec "$@"