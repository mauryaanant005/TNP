#!/bin/sh

set -e

echo "Waiting for MySQL to be ready..."

python << END
import sys
import time
import socket

# Replace 'mysql' with your service name if different, or use os.environ
db_host = "mysql"
db_port = 3306

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

echo "Collecting static files..."

python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Creating superuser..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists() or User.objects.create_superuser('$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')"

echo "Starting ASGI application with daphne..."
exec daphne -b 0.0.0.0 -p 8000 t_and_p_automation.asgi:application