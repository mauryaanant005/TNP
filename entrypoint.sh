#!/bin/sh

set -e

# ENV=DEV uses SQLite (see config/settings.py) - there's no
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

  echo "Creating superuser and repairing unhashed user passwords..."
  python manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

User = get_user_model()
email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

if not email or not password:
    print("DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD not set - skipping superuser creation.")
else:
    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(email, password)
        print("Superuser created.")
    else:
        print("Superuser already exists.")

# Repair any existing users in DB that have invalid/unhashed/empty passwords
default_pwd = os.environ.get("DEFAULT_SEED_PASSWORD", "tcet@1234")
default_pwd_hash = make_password(default_pwd)
users_to_fix = []

for u in User.objects.all():
    if not u.password or not (u.password.startswith(('pbkdf2_sha256$', 'pbkdf2_sha1$', 'argon2$', 'bcrypt$', 'scrypt$', 'bcrypt_sha256$')) or u.password.startswith('!')):
        u.password = default_pwd_hash
        users_to_fix.append(u)

if users_to_fix:
    User.objects.bulk_update(users_to_fix, ['password'])
    print(f"Repaired passwords for {len(users_to_fix)} user accounts.")
PYEOF
fi

echo "Starting: $@"
exec "$@"