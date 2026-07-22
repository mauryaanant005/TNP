# ---------- Frontend Build ----------
FROM node:18 AS frontend

WORKDIR /app

COPY client_app/package.json client_app/package-lock.json ./
RUN npm install
COPY client_app/ ./
RUN npm run build


# ---------- Backend ----------
FROM python:3.12

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Copy frontend build output
COPY --from=frontend /app/build/index.html /app/templates/index.html
COPY --from=frontend /app/build/static /app/static/

# Copy vite.svg only if it exists
# If your build doesn't generate it, remove this line.
COPY --from=frontend /app/build/vite.svg /app/static/

# Collect static files
RUN python manage.py collectstatic --noinput

# Entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# Gunicorn
CMD ["gunicorn", "t_and_p_automation.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "300", "--graceful-timeout", "60", "--keep-alive", "5", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]