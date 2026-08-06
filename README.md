# T&P Task Automation

Role-based placement and training management system for **Thakur College of Engineering and Technology**. Automates student categorization, placement pipeline tracking, training attendance/performance, internship management, and reporting — serving 8+ user roles from a single Django + React application.

## What It Does

- Classifies students into Green/Yellow/Orange/Red categories based on configurable academic and training thresholds
- Manages the full placement lifecycle — company registration, eligibility filtering, student consent, application tracking, offer management
- Tracks training attendance across programs (ACT, SDP, Coding Contests) with Excel upload and per-category performance marks
- Provides role-specific dashboards with charts (placements over time, salary distribution, branch performance)
- Handles internship registrations, applications, offer letters, and compliance
- Exports student data and resumes asynchronously via Celery

## What It Doesn't Do

- No automatic attendance scraping — attendance is uploaded via spreadsheets by coordinators
- No student-facing application portal (students interact through the staff interface)
- No integration with external job boards or ATS systems

---

## Quick Start

```bash
git clone <repo> && cd t_and_p_task_automation
cp .env.example .env

# One-time: the compose file joins `dokploy-network` (owned by the hosting
# platform in production, where the managed database lives). It doesn't
# exist on a dev machine, so create an empty stand-in once:
docker network create dokploy-network

# `docker-compose.dev.yml` publishes ports 8000/5173 to your host. It is
# NOT auto-applied - production must not expose ports - so pass it
# explicitly for local work:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

This starts four containers: `api` (Django/DRF/Channels via Gunicorn), `frontend` (the React
build served by Nginx), `celery` (async task worker), and `redis` (broker/cache). The frontend
and API are separate origins even locally, matching production - see **Deployment Architecture**
below. A superuser is auto-created from `.env` (`admin@gmail.com` / `admin123`).

The API is then on `http://localhost:8000` (health check: `/api/health/`) and the frontend on
`http://localhost:5173`. In production neither publishes a port - Traefik routes to them over
the internal Docker network.

---

## Manual Setup

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
mysql -u root -e "CREATE DATABASE t_and_p_automation;"
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (separate terminal)
cd client_app
npm install
npm run dev
```

---

## Real Usage Examples

**Get placement dashboard for a batch:**

```bash
curl -u email:password http://localhost:8000/api/placement_officer/dashboard/BE_2024/
```

```json
{
  "placementsOverTime": [{"month": "Jan 2024", "placements": 12}],
  "departmentPerformance": [{"department": "COMP", "total": 120, "placed": 85}],
  "salaryDistribution": [{"range": "5-7 LPA", "count": 30}],
  "topRecruiters": [{"name": "TCS", "hires": 25}]
}
```

**Upload training performance from CSV:**

```bash
curl -X POST -F "file=@scores.csv" \
  http://localhost:8000/api/program_coordinator/training-performance/upload/ACT_Aptitude/
```

**List companies for a batch (staff):**

```bash
curl http://localhost:8000/api/staff/placement/companies/batch/BE_2024/
```

**Trigger async resume export for a company (staff):**

```bash
curl -X POST http://localhost:8000/api/staff/company/<company_id>/trigger-resume-export/
# Returns a task_id — poll status:
curl http://localhost:8000/api/staff/task-status/<task_id>/
```

---

## User Roles

| Role | What They Can Do |
|------|------------------|
| **System Admin** | Full admin panel (django-unfold), user management, role assignment |
| **Principal** | Aggregate dashboards and reports across all departments |
| **Training Officer** | Upload training attendance & performance per program |
| **Placement Officer** | Placement dashboards, configure category rules, branch reports, consent analytics |
| **Internship Officer** | Register internship companies, create notices, manage offers |
| **Faculty Coordinator** | Manage assigned programs (ACT, SDP, Coding Contests) |
| **Staff** | Company CRUD, notices, eligible student lists, progress tracking, exports |
| **Student** | Profile, resume builder, placement card, training performance, internship applications |

---

## API Reference

| Prefix | Module | Auth | Purpose |
|--------|--------|------|---------|
| `/auth/` | base | None | Login, OTP password reset, logout |
| `/api/student/` | student | Session | Profile, resume, attendance, placement card, training performance |
| `/api/placement_officer/` | placement_officer | Session | Dashboards, consent stats, category data, branch reports |
| `/api/training_officer/` | training_officer | Session | Training data management |
| `/api/program_coordinator/` | program_coordinator_api | Session | Attendance upload, training performance, student analytics |
| `/api/internship/` | internship_api | Session | Company registration, offers, applications |
| `/api/faculty_coordinator/` | faculty_coordinator | Session | Faculty program management |
| `/api/staff/` | staff | Session | Companies, notices, student progress, Excel/Resume exports |
| `/api/notifications/` | notifications | Session | Notification CRUD |
| `/admin/` | django-admin | Session | django-unfold admin panel |

---

## Configuration

All env vars in `.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_NAME` | `t_and_p_automation` | MySQL database |
| `DATABASE_USER` | `t_and_p` | MySQL user |
| `DATABASE_PASSWORD` | — | MySQL password |
| `EMAIL_USERNAME` | — | Gmail SMTP user (OTP/notifications) |
| `EMAIL_PASSWORD` | — | Gmail app password |
| `ENV` | `DEV` | `DEV` or `PROD` — controls debug, CORS, DB host |
| `CLIENT_URL` | `http://localhost` | Frontend URL for CORS |
| `CURRENT_HOST` | `localhost` | Allowed host header |
| `DJANGO_SUPERUSER_EMAIL` | `admin@gmail.com` | Auto-created during `entrypoint.sh` |
| `DJANGO_SUPERUSER_PASSWORD` | `admin123` | Superuser password |
| `DEFAULT_SEED_PASSWORD` | — | Password set by `create_coordinators.py`, `import_faculty.py`, `reset_passwords_temp.py`, `seed_dummy_students.py`, and the department-coordinator bulk-create endpoint |
| `DEFAULT_FACULTY_IMPORT_PASSWORD` | — | Fallback password used by `base/resources.py` when a faculty bulk-import spreadsheet has no `password` column |
| `DEFAULT_STUDENT_IMPORT_PASSWORD` | — | Fallback password used by `student/resources.py` when a student bulk-import spreadsheet has no `password` column |
| `REDIS_PASSWORD` | — | Auth password for the Redis container (cache, Celery broker, channel layer) - required in PROD |
| `DATABASE_HOST` | `mysql` | Managed MySQL host, provisioned by the hosting platform's IT team in PROD |
| `DATABASE_PORT` | `3306` | Managed MySQL port |
| `DATABASE_SSL_MODE` | `REQUIRED` | MySQL SSL mode in PROD (`REQUIRED`, `VERIFY_CA`, `VERIFY_IDENTITY`) |
| `DJANGO_ALLOWED_HOSTS` | — | Comma-separated API hostname(s) in PROD, e.g. `api.yourproject.example.com` |
| `COOKIE_DOMAIN` | — | Shared parent domain for session/CSRF cookies in PROD, e.g. `.yourproject.example.com` (leading dot) - lets frontend JS on the apex domain read the CSRF cookie set by the api subdomain |
| `VITE_SERVER_URL` | `""` (same-origin) | Build-time only: the API's origin, e.g. `https://api.yourproject.example.com`. Baked into the frontend bundle via `docker-compose.yml`'s `frontend` build args - not read at container runtime |

---

## Tech Stack

**Backend:** Django 5.1, DRF 3.15, Django Channels, Celery, MySQL 8, Redis  
**Frontend:** React 18, TypeScript, Vite, MUI 6, Tailwind CSS, Radix UI, TanStack Query, Recharts  
**Infrastructure:** Docker, Gunicorn (Uvicorn worker), Nginx (frontend static build only), django-unfold (admin)

---

## Deployment Architecture

The frontend and API are two separate containers on two separate origins - this mirrors production,
where they're served from different subdomains behind a reverse proxy/CDN neither container runs
itself:

```
Browser
 ├─ frontend origin  → frontend container (Nginx serving the Vite build; SPA routing only)
 └─ api origin       → api container (Gunicorn + Uvicorn worker, Django/DRF/Channels)
     wss://<api origin>/ws/notifications/ → same api container

celery  → same image as api, runs `celery worker`, talks to redis + MySQL
redis   → self-hosted broker/cache (not a managed service)
MySQL   → managed externally (DATABASE_HOST/NAME/USER/PASSWORD), never run as a container here
```

Because the frontend and API are different origins, every frontend API call goes through
`client_app/src/lib/api.ts` (`api` - an `axios` instance, or `apiFetch` - a `fetch` wrapper), which
prefixes `VITE_SERVER_URL` and sends credentials, instead of relying on same-origin relative paths.

Gunicorn runs with a Uvicorn worker (`-k uvicorn.workers.UvicornWorker`, serving
`t_and_p_automation.asgi:application`) rather than plain WSGI, since the notifications feature needs
an ASGI server for its WebSocket (Django Channels). This lets a single `api` container serve both
regular HTTP and the `/ws/notifications/` WebSocket route.

---

## Project Structure

```
t_and_p_task_automation/
├── t_and_p_automation/       # Django project config, root URLs, Celery config
├── base/                     # Custom User model, auth with OTP password reset
├── student/                  # Student model, resume builder, offers, placement card
├── placement_officer/        # Dashboards, category rules, consent/reporting APIs
├── training_officer/         # Training officer functionality
├── program_coordinator_api/  # Attendance records, training performance uploads
├── internship_api/           # Internship companies, offers, applications
├── faculty_coordinator/      # Faculty-managed program coordination
├── staff/                    # Companies, notices, student progress, async exports
├── department_coordinator/   # Department-level coordination
├── notifications/            # Notification model + CRUD (incl. WebSocket consumer)
├── backend/Dockerfile        # Multi-stage: pip install → collectstatic → gunicorn+uvicorn
├── client_app/               # React SPA (Vite + MUI + Tailwind)
│   ├── Dockerfile            # Multi-stage: npm build → nginx serving the static build
│   ├── nginx.conf            # SPA fallback routing (try_files → index.html)
│   └── src/lib/api.ts        # Centralized API client (base URL + credentials)
├── static/                   # Static assets (served via WhiteNoise inside the api container)
├── docker-compose.yml        # api + frontend + celery + redis only (no MySQL/reverse proxy)
└── entrypoint.sh             # Waits for MySQL → migrate → seed superuser → exec "$@"
```

---

## Student Categorization Logic

Students are classified into 4 categories based on configurable `CategoryRule` thresholds per batch:

1. Each rule defines minimums for: academic attendance, academic performance, training attendance, training performance
2. Rules are evaluated in order (Category 1 → Category 4) — first match wins
3. The `Placement Officer` can trigger recalculation via `/api/placement_officer/calculate-category/`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MySQL Connection refused` | Docker: `entrypoint.sh` waits 30s. Manual: ensure MySQL is running and `.env` matches |
| Frontend shows blank page | Run `npm run build` in `client_app/` or start Vite dev server on `:5173` |
| OTP emails not sending | Use a [Gmail app password](https://support.google.com/accounts/answer/185833) — not your regular password |
| Celery tasks never execute | Start worker: `celery -A t_and_p_automation worker --loglevel=info`. Ensure Redis is running on `:6379` |
| `django.db.utils.OperationalError: (1146)` | Run `python manage.py migrate` |

---

## Contributing

PRs welcome. Open an issue for significant changes. No formal style guide — match the existing code conventions.

---

## Security Warning

> **CRITICAL:** If any secrets (such as `EMAIL_PASSWORD`, `DATABASE_PASSWORD`, or API keys) were previously hardcoded in the codebase, they remain embedded in the Git history. 
> You MUST rotate (change) these passwords/keys immediately in the external services and ensure they are only loaded via the `.env` file moving forward. Do not rely on removing them from the current working tree, as the Git history is still exposed.

---

## License

Internal tool — Thakur College of Engineering and Technology.
