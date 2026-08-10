# Backend-only image (Django/DRF/Channels). Build context is the repo root
# (see docker-compose.yml: context: ., dockerfile: backend/Dockerfile), so
# all COPY paths below are relative to the repo root, not this folder.

# ---------- Stage 1: Build ----------
FROM python:3.12-slim AS builder
WORKDIR /app

# ARG, not ENV: this only needs to hold while apt runs during the build.
# Setting it as ENV would bake it into the final image, so anyone who later
# apt-installs inside a running container gets silent non-interactive
# behaviour they did not ask for - Docker's own docs call that out.
#
# Without it, debconf tries to open its dialog frontend, finds no TTY, and
# logs "unable to initialize frontend: Dialog" before falling back. Harmless,
# but it is noise in every build log.
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Installed to the system site-packages (no --user) rather than /root/.local
# - the latter is only readable by root, and USER django below drops root,
# so a non-root process couldn't import anything from there.
RUN pip install --no-cache-dir -r requirements.txt

# ---------- Stage 2: Production runner ----------
FROM python:3.12-slim AS runner
WORKDIR /app

# ARG is per-stage, so it has to be declared again here. See stage 1.
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV PYTHONUNBUFFERED=1

# Build-time collectstatic only needs to enumerate static files (admin CSS/JS,
# unfold theme, DRF browsable API) - it never touches the database, so DEV
# mode is safe here even though no real secrets exist yet. The container
# still picks up its real ENV from the injected environment at runtime.
RUN ENV=DEV python manage.py collectstatic --noinput

RUN addgroup --system django && adduser --system --ingroup django django \
    && mkdir -p /app/media /app/data \
    && chown -R django:django /app
USER django

COPY --chown=django:django entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]

# Gunicorn with a Uvicorn worker: this app uses Django Channels for a
# real-time notifications WebSocket (config/asgi.py), so it needs
# an ASGI-capable process. Gunicorn is still the invoked process/production
# server (per the hosting standard); the Uvicorn worker class lets it serve
# both HTTP and WebSocket traffic on the same port, which IT routes to via
# both api.<domain> and socket.<domain> (hosting standard section 11.4).
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "config.asgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
