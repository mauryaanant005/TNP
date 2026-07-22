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
docker compose up --build
```

The app is available at `http://localhost`. A superuser is auto-created from `.env` (`admin@gmail.com` / `admin123`).

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
| `DATABASE_ROOT_PASSWORD` | — | MySQL root password |
| `EMAIL_USERNAME` | — | Gmail SMTP user (OTP/notifications) |
| `EMAIL_PASSWORD` | — | Gmail app password |
| `ENV` | `DEV` | `DEV` or `PROD` — controls debug, CORS, DB host |
| `CLIENT_URL` | `http://localhost` | Frontend URL for CORS |
| `CURRENT_HOST` | `localhost` | Allowed host header |
| `DJANGO_SUPERUSER_EMAIL` | `admin@gmail.com` | Auto-created during `entrypoint.sh` |
| `DJANGO_SUPERUSER_PASSWORD` | `admin123` | Superuser password |

---

## Tech Stack

**Backend:** Django 5.1, DRF 3.15, Celery, MySQL 8, Redis  
**Frontend:** React 18, TypeScript, Vite, MUI 6, Tailwind CSS, Radix UI, TanStack Query, Recharts  
**Infrastructure:** Docker, Gunicorn, Caddy (reverse proxy), django-unfold (admin)

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
├── notifications/            # Notification model + CRUD
├── client_app/               # React SPA (Vite + MUI + Tailwind)
├── templates/                # Django templates (base.html + React build index)
├── static/                   # Static assets
├── Dockerfile                # Multi-stage: npm build → pip → collectstatic
├── docker-compose.yml        # MySQL + Redis + Backend + Caddy
├── Caddyfile                 # Reverse proxy for /static/ /media/ → backend
└── entrypoint.sh             # Waits for MySQL → migrate → seed superuser → gunicorn
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

## License

Internal tool — Thakur College of Engineering and Technology.
