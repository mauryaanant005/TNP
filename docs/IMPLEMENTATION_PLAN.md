# TNP Portal — Implementation Plan

**Companion to** [`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md) — that document explains *what
is wrong and why*; this one is *what to do, in what order, and how to know it worked*.

**Execution model:** AI coding agents, one task per session.
**Estimate:** ~4 weeks · **4 phases · 4 test cycles.**

---

## The four phases

| # | Phase | Tasks | Time | You test | Status |
|---|---|---|---|---|---|
| **1** | **Secure & Stabilise** — stop the breach, add tests, fix auth | T-01 … T-15 | ~1 wk | [How →](#-testing-phase-1) | 🟨 11/15 · [record](PHASE_1_IMPLEMENTATION.md) |
| **2** | **Restructure** — domain apps, one attendance model | T-16 … T-23 | ~1 wk | [How →](#-testing-phase-2) | 🟨 6/8 · [record](PHASE_2_IMPLEMENTATION.md) |
| **3** | **Schema correctness** — types, FKs, audit trail | T-24 … T-33 | ~1 wk | [How →](#-testing-phase-3) | ⬜ |
| **4** | **Features** — OAuth, unified login, marks, grade cards | T-34 … T-41 | ~1 wk | [How →](#-testing-phase-4) | ⬜ |

**Test once per phase, not once per task.** Each phase ends with a gate you run yourself; the
agent's per-task acceptance checks are just its own guardrails along the way.

### Review levels

| | Meaning |
|---|---|
| 🟢 | Agent completes and self-verifies. Merge if green. |
| 🟡 | Agent completes; you read the diff before merge. Touches real logins or business rules. |
| 🔴 | Agent may *prepare* it; **you** run and verify. Destructive or irreversible. |

### Two rules that outrank every task

1. **Tests land before refactors.** Phase 1 blocks Phases 2–4. With no tests, neither a human nor
   an agent can refactor safely — and an agent will additionally produce a confident, plausible,
   subtly wrong diff that reads fine on review.
2. **An agent never confirms its own data migration.** It writes the migration *and* a
   verification script, then stops. You run it against a copy and read the numbers.

`⬜ not started` · `🟨 in progress` · `✅ done` · `⛔ blocked`

---

# Phase 1 — Secure & Stabilise

**Goal:** stop the data breach, get a safety net, make authorisation mean something.
**Why first:** everything after this is a refactor, and refactoring without tests is guessing.

### T-01 · Make the repository private 🔴
GitHub → Settings → Danger Zone → Change visibility. Audit §1.
**Status:** ⬜

### T-02 · Purge student data from git history 🔴
Deleting in a new commit is **not** enough — every prior commit still contains the files.
```bash
git clone --mirror https://github.com/mauryaanant005/TNP.git tnp-backup   # back up first
pip install git-filter-repo
git filter-repo --path-glob '*.xls' --path-glob '*.xlsx' --path-glob '*.csv' --invert-paths
git push --force --all
```
⚠️ Rewrites history — coordinate with anyone holding a clone. **Do not delegate to an agent.**
**Status:** ⬜

### T-03 · Escalate internally 🔴
Notify whoever owns data protection at TCET. Public since `2026-07-22`. Treat as compromised.
**Status:** ⬜

### T-04 · Ignore rules ✅
`*.xls`, `*.xlsx`, `*.csv`, `local_data/` in `.gitignore` + `.dockerignore`; ops scripts excluded
from the image. ⚠️ Blocks *new* additions only — existing files stay tracked until T-02.
**Status:** ✅ done

### T-05 · Fix dev/prod database parity 🟢 ✅
Dev runs **SQLite**, production runs **MySQL** — different constraint enforcement, collation and
casing. A migration can pass locally and fail in production, which means **an agent gets a false
green on its own acceptance check**. Add MySQL to `docker-compose.override.yml` for local dev.
**Do this before any schema work.**
**Status:** ✅ done — `DATABASE_ENGINE` switch + MySQL in `docker-compose.dev.yml`; suite green on both engines

### T-06 · Test infrastructure 🟢 ✅
`pytest`, `pytest-django`, `factory-boy` + factories for `User`, `Student`,
`CompanyRegistration`. GitHub Actions running `pytest` and `makemigrations --check --dry-run`.
**Status:** ✅ done — pytest/pytest-django/factory-boy, `tests/`, GitHub Actions on both engines

### T-07 · Write the permission matrix 🟡 ✅
`docs/PERMISSIONS.md` — one row per endpoint, one column per role, cell = expected status.
Write what *should* be true, not what is true today (today is wrong — audit §4.1). Flag anything
ambiguous instead of guessing.
**You approve this** — it becomes the spec and the test fixture.
**Status:** 🟡 written — **awaiting your approval**; 5 open questions at the foot of `docs/PERMISSIONS.md`

### T-08 · Permission matrix test 🟢 ✅
```python
@pytest.mark.parametrize("role,method,endpoint,expected", PERMISSION_MATRIX)
def test_role_access(api_client, role, method, endpoint, expected):
    api_client.force_login(user_with_role(role))
    assert api_client.generic(method, endpoint).status_code == expected
```
**Must FAIL on first run** on `role="staff"` vs `/api/staff/*`, reproducing the known bug.
If it passes immediately the test is wrong.
**Status:** ✅ done — **failed 174 of 716 cases on first run**, now green

### T-09 · Characterisation tests for domain logic 🟡 ✅
Pin current behaviour of **categorisation** (`CategoryRule` → `current_category`/`card`) and
**eligibility** (`is_student_eligible`) so later refactors cannot silently change results.
**You confirm** the pinned rules are actually correct — some may already be wrong.
**Status:** ✅ done — 24 tests; 5 findings pinned ⚠️ rather than fixed, see the phase record

### T-10 · Single permission layer 🟢 ✅
`accounts/permissions.py` — one `HasRole` class replacing 3 mechanisms:
```python
class HasRole(BasePermission):
    """permission_classes = [HasRole.of("staff", "placement_officer")]"""
    roles: tuple = ()

    @classmethod
    def of(cls, *roles):
        return type(f"HasRole_{'_'.join(roles)}", (cls,), {"roles": roles})

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_superuser or u.role in self.roles))
```
Plus `DepartmentScopedMixin` for the `FacultyResponsibility` filtering currently re-implemented
per view.
**Status:** ✅ done — `base/permissions.py`: `HasRole`, `ROLES`, `DepartmentScopedMixin`

### T-11 · Remove `IsAdminUser` and all inline role checks 🟢 ✅
19 `IsAdminUser` sites + ~20 inline `if user.role` checks → `permission_classes`.
Several currently return `404 "Failed to find user"` for an authz failure — those become `403`.
**Accept:** `grep -rn "IsAdminUser\|user.role" --include="views.py" .` → empty.
**Status:** ✅ done — 0 `IsAdminUser` remaining; found a dead-feature bug, see the phase record

### T-12 · Reclaim the `is_staff` flag 🟡
Strip `is_staff` from the 16 non-admin accounts (10 faculty + officers). After T-11 nothing in
the API reads it, so it reverts to meaning only "may open Django admin".
**You confirm the admin list first** — this affects real people's access.
**Status:** ⬜

### T-13 · Frontend route guards 🟢 ✅
`<RequireRole>` on all 10 route groups in `client_app/src/routes/` (currently **zero** guards).
Unauthorised → redirect to that role's home, not a blank 403.
**Status:** ✅ done — `<RequireRole>` on all 10 route groups

### T-14 · Fix the login rate limit 🟢 ✅
Currently 5 logins/min for the **entire college** behind Traefik (audit §5).
```python
RATELIMIT_IP_META_KEY = "HTTP_X_FORWARDED_FOR"          # Traefik is the sole ingress
@ratelimit(key="post:email", rate="5/m",   method="POST", block=True)
@ratelimit(key="ip",         rate="100/m", method="POST", block=True)
```
**Status:** ✅ done — per-account keying + `base/ratelimit.py`; the header-absent 500 is covered

### T-15 · Global pagination 🟢 ✅
Only 2 apps paginate; any list endpoint currently returns every row.
```python
REST_FRAMEWORK = {"DEFAULT_PAGINATION_CLASS": "...PageNumberPagination", "PAGE_SIZE": 50}
```
Coordinated FE/BE change — the React code expects bare arrays in several places.
**Status:** ✅ done — global DRF pagination + 3 frontend call sites unwrapped

---

## ✅ Testing Phase 1

**Automated** — should all pass:
```bash
docker exec t_and_p_automation-api-1 pytest -q
docker exec t_and_p_automation-api-1 python manage.py makemigrations --check --dry-run
```

**Breach is contained:**
```bash
curl -s https://api.github.com/repos/mauryaanant005/TNP | grep -q "Not Found" && echo "PRIVATE ✅"
git log --all --diff-filter=A --name-only | grep -iE '\.xls|\.csv'    # must print nothing
```

**Manual — 15 minutes, do this yourself.** Create one user per role, then for each:

| Check | Expected |
|---|---|
| Log in, open your own dashboard | Loads |
| Type another role's URL directly (e.g. student → `/staff/companies`) | Redirected, not shown |
| A `role="staff"` user opens placement companies | **Works** (this was 403 before) |
| A `faculty` user opens `/admin/` | **Blocked** (was 200 before) |
| Log in as 10 different users within a minute | All succeed, no lockout |
| Any list page with >50 records | Paginated |

**✅ Phase 1 is done when:** the permission matrix test is green, the repo is private with clean
history, and the staff/faculty checks above behave the *opposite* of how they behaved before.

---

# Phase 2 — Restructure

**Goal:** apps organised by domain, one attendance model instead of five.
**Method — strangler fig** (audit §3.2): do **not** hand an agent a 551-line role app to tidy.
**Write the new app clean → port the logic → repoint URLs → delete the old app.** The old code is
the reference spec; the new code is greenfield. T-09's tests prove they agree.

### T-16 · Housekeeping 🟢 ✅
Delete the dead `placement_api/` app (migrations folder only). Rename `t_and_p_automation/` →
`config/`.
**Status:** ✅ done — `placement_api/` deleted; `t_and_p_automation/` → `config/`

### T-17 · `institution/` reference app 🟢 ✅
`Department`, `Batch`, `AcademicYear`, `Program`, `Semester`. Seed from the distinct values in
today's free-text columns. No behaviour change yet — this creates the target tables for T-24.
**Status:** ✅ done — 6 models + `manage.py seed_institution`; **run `--dry-run` and settle the duplicate merges before T-24**

### T-18 · `training/` — unify the five attendance models 🔴
> **Highest-risk task in this plan.**

Collapse `AttendanceData`, `BatchAttendance`, `SimpleAttendanceData`, `AttendanceRecord` (JSON
blob) and `Program1` into:
```python
class TrainingSession(models.Model):    # program, date, session_no, semester, phase
class SessionAttendance(models.Model):
    # student FK, session FK, status, marked_by, marked_at
    class Meta:
        indexes = [
            models.Index(fields=["student", "session"]),
            models.Index(fields=["session"]),
        ]
        constraints = [models.UniqueConstraint(fields=["student", "session"],
                                               name="uniq_student_session")]
```
Backfill the `student_data` JSON into real rows. **Indexes are part of this task** — this becomes
the largest table in the system and today the entire codebase declares only 5 `db_index=True`.

**Agent delivers:** the migration **and** `scripts/verify_attendance_migration.py` comparing
per-student totals old vs new — then **stops**.
**Status:** ⏸ **PREPARED, NOT APPLIED.** Built as `manage.py backfill_attendance` rather than a data migration, because `entrypoint.sh` migrates on every boot. Refuses to commit if any row would be skipped. **You run it, and the verification script, against a copy.**

### T-19 · `placements/` — port from `staff/` + `placement_officer/` 🟢 ✅
Write fresh, port company/drive/offer logic, repoint URLs, delete both old apps. URL paths stay
unchanged.
**Status:** ✅ done — models moved state-only (`db_table` pinned, **zero DDL**); upgrade path verified on populated MySQL; 921 tests green on both engines. Revived 2 dead features — see PHASE_2_IMPLEMENTATION.md.

### T-20 · `students/` + dissolve the role apps 🟢
`department_coordinator/`, `faculty_coordinator/`, `training_officer/` own **zero models** — pure
views over other apps' data. Port each into the domain app owning its data; delete all three.
**Status:** ⬜ not started — unblocked; T-19 is the worked example to copy

### T-21 · Service layer 🟢
Business logic out of views into `services.py`. Worst offenders: `program_coordinator_api/views.py`
(883 LOC), `department_coordinator/views.py` (551).
**Accept:** no `views.py` over ~150 LOC.
**Status:** 🟨 partial — `placements/services.py` done in T-19; `placements/views.py` still 524 LOC and the other apps are untouched

### T-22 · OpenAPI schema + generated TS client 🟢 ✅
`drf-spectacular` → `/api/schema/` → typed client in `client_app/src/lib/generated/`.
High leverage here: an agent **cannot** invent an endpoint shape or drift a field name.
**Status:** ✅ done — `/api/schema/` (83 paths) + committed `client_app/src/lib/generated/`; CI fails on schema or type drift. 69 paths still warn (function-based views) and shrink as T-19..T-21 land.

### T-23 · Stop materialising notification recipients 🟢 ✅
`Notification.recipients` M2M writes one row per user per broadcast. The targeting metadata
(`target_audience`, `target_departments`) already exists — resolve recipients at *read* time.
Keep `NotificationRead` for read-state only.
**Status:** ✅ done — read-time resolution, equivalence-tested against the old rules; fixed a pre-existing N+1 in `get_is_read`

---

## ✅ Testing Phase 2

This phase must change **structure only, never behaviour** — so the test is comparison.

**Before you start:** take a backup and a baseline.
```bash
docker exec t_and_p_automation-api-1 python manage.py dumpdata > backup_pre_phase2.json
```
Screenshot each role's main dashboard. These are your reference.

**The attendance migration (T-18) — you run this, not the agent:**
```bash
# 1. work on a copy, never the real DB
# 2. apply the migration
# 3. run the agent's verification script
docker exec t_and_p_automation-api-1 python scripts/verify_attendance_migration.py
```
**Expected:** zero mismatches across all students. **Any mismatch → roll back, don't debug forward.**

**Automated:**
```bash
docker exec t_and_p_automation-api-1 pytest -q     # characterisation tests still green
```

**Manual — compare against your screenshots:**

| Check | Expected |
|---|---|
| Each role's dashboard | Identical numbers to the screenshots |
| Pick 3 students — attendance % | Same as before the migration |
| Upload an attendance spreadsheet | Works; numbers appear correctly |
| Send an "all students" notification | Sends; check it wrote O(1) rows, not 1400 |
| Old URLs still respond | Unchanged — the frontend shouldn't notice |

**✅ Phase 2 is done when:** dashboards show identical numbers, the verification script reports
zero mismatches, and `department_coordinator/`, `faculty_coordinator/`, `training_officer/`,
`placement_api/` no longer exist.

---

# Phase 3 — Schema correctness

**Goal:** types that mean something, real foreign keys, an audit trail on legal records.
**Prerequisite:** T-05 (MySQL in dev) — otherwise every migration here is verified on the wrong
engine.

### T-24 · Free-text → foreign keys 🔴
`department`, `batch`, `academic_year`, `division`, `program` across ~10 models → FKs into
`institution/`. The data migration **must report unmapped values rather than dropping rows** —
expect typos and casing variants. Finding them is the point.
**Status:** ⬜

### T-25 · Fix the types 🟡
- `min_cgpa`, `min_tenth_marks`, `min_higher_secondary_marks`, `JobOffer.salary` → `Decimal`
  (currently `CharField` — eligibility can't be filtered in SQL)
- `StudentOffer.salary`, `InternshipAcceptance.salary` `Float` → `Decimal` (money)
- `InternshipNotice.date`, `Resume_*.start_date`/`end_date` `TextField` → `DateField`

**Accept:** unparseable values reported, never silently nulled.
**Status:** ⬜

### T-26 · Real foreign keys 🔴
`InternshipApplication.student` `CharField` → FK. `on_delete=DO_NOTHING` → `PROTECT`.
`Student.user` `SET_NULL` → `CASCADE`.
**Accept:** orphan report empty before constraints are applied.
**Status:** ⬜

### T-27 · Audit trail 🟢
`created_at`/`updated_at`/`updated_by` on `Student`, `StudentOffer`, `CompanyRegistration`,
`JobOffer`, `Notice`, `InternshipAcceptance`. `django-simple-history` on offers and placement
status.
**Status:** ⬜

### T-28 · Generalise selection rounds 🟢
Replace `PlacementCompanyProgress`'s five hardcoded booleans with `SelectionRound(drive, order,
name)` + `StudentRoundResult`. Must be able to model 3 technical rounds + a case study.
**Status:** ⬜

### T-29 · One category system 🟡
Collapse `Student.current_category` (`Category 1/2/3`), `CategoryRule.category` (`Category_1…4`)
and `Student.card` (`Green/…/Red`) into one canonical list.
**You decide** which spelling is canonical — the README says Green/Yellow/Orange/Red.
**Status:** ⬜

### T-30 · Fix the three confirmed bugs 🟢
1. `TrainingPerformanceCategory.__str__` → `AttributeError` (no `uid` field)
2. `SEM_OPTIONS[6] == ("Semester 7", "Semester 8")` — value/label mismatch
3. `InternshipAcceptance.save()` raises `ValueError` → HTTP 500; move to serializer validation

Regression test each.
**Status:** ⬜

### T-31 · Move bulk import/export to Celery 🟢
A large spreadsheet upload currently runs in-request and will hit Gunicorn's timeout. Celery is
already running; the pattern exists in `TriggerExcelExportView`.
**Status:** ⬜

### T-32 · Deployment defaults 🟢
```python
DATABASES["default"]["CONN_MAX_AGE"] = 60    # currently a new DB connection PER REQUEST
SESSION_ENGINE = "django.contrib.sessions.backends.cache"   # Redis already configured, unused
```
Plus Gunicorn workers from `WEB_CONCURRENCY` instead of hardcoded `--workers 3`.
**Status:** ⬜

### T-33 · Query-count guards 🟢
Nothing currently stops an agent writing an N+1 query — they produce idiomatic ORM that issues
one query per row. Invisible at 1,400 students, a timeout at 10,000, and it passes tests and
review. Add `assertNumQueries` around list-endpoint tests + `nplusone` in CI.
**Accept:** seed at two volumes (50 / 500); query count must not grow with row count.
**Status:** ⬜

---

## ✅ Testing Phase 3

**Before you start:** back up again — this phase rewrites columns.
```bash
docker exec t_and_p_automation-api-1 python manage.py dumpdata > backup_pre_phase3.json
```

**The two 🔴 migrations (T-24, T-26) — you run these:**
Each agent-written migration prints a report **before** applying. Read it:
- **Unmapped values** (T-24) → real typos in your data. Decide the mapping; don't let it drop rows.
- **Orphan records** (T-26) → rows pointing at nothing. Fix before the constraint goes on.
Row counts before and after must match exactly.

**Automated:**
```bash
docker exec t_and_p_automation-api-1 pytest -q          # incl. new regression + query-count tests
```

**Manual:**

| Check | Expected |
|---|---|
| Open 5 students — CGPA, marks, offers | Values unchanged, correct decimals |
| A salary field | Exact, no float artefacts (`600000`, not `599999.94`) |
| Edit a student, reopen | `updated_at`/`updated_by` populated |
| Company eligibility filter | Returns the same students as before |
| Create a drive with 3 technical rounds | Possible (was impossible) |
| Upload a large spreadsheet | Returns immediately, completes in background |
| Django admin → a training performance record | Opens (this used to crash) |

**✅ Phase 3 is done when:** row counts match across every migration, the 5 spot-checked students
are unchanged, and `pytest` is green including query-count tests.

---

# Phase 4 — Features

**Goal:** the things you actually wanted. Cheap now because the foundation carries them.

### T-34 · Google OAuth on college mail 🟡
`django-allauth` restricted to your Workspace domain:
```python
SOCIALACCOUNT_PROVIDERS = {"google": {"APP": {...}, "AUTH_PARAMS": {"hd": "tcetmumbai.in"}}}
```
⚠️ **Verify the `hd` claim server-side on the returned ID token** — as an auth param it's a UI
hint, not a guarantee. Link to existing users by email; new social signups default to `student`,
never an elevated role.
**Status:** ⬜

### T-35 · Unified login with the coding portal 🟡
```python
SESSION_COOKIE_DOMAIN = ".tcetmumbai.in"
CSRF_COOKIE_DOMAIN    = ".tcetmumbai.in"
```
No new infrastructure, no separate identity provider (audit §3.4). Revisit `django-oauth-toolkit`
only at a third app.
**Status:** ⬜

### T-36 · Email reliability 🟢
Gmail caps ~500 recipients/day. One all-students broadcast exhausts the quota and **OTP logins
then silently stop working**. Route OTP through a separate transactional sender (Brevo/Mailjet
free tier); keep bulk on Workspace relay. Also fix `_create_user`'s bare `except: pass`, which
currently hides send failures entirely.
**Status:** ⬜

### T-37 · `reports/` aggregation layer 🟢
Summary tables (e.g. `AttendanceSummary`) refreshed by Celery beat + Redis caching for dashboard
endpoints. Redis is already configured and unused.
**Status:** ⬜

### T-38 · ISE marks entry 🟢
Per-subject, per-exam marks in `academics/AcademicPerformance`. Excel upload via the existing
import pipeline.
**Status:** ⬜

### T-39 · Grade card download 🟢
PDF via the existing WeasyPrint pipeline (already used for resumes). Needs T-38.
**Status:** ⬜

### T-40 · Guardian reports 🟡
`Guardian` FK on `Student`; scheduled performance summary via Celery beat.
**You confirm consent handling** — this sends student data to third parties.
**Status:** ⬜

### T-41 · Dean / principal analytics 🟢
Cross-department dashboards off the `reports/` layer.
**Status:** ⬜

---

## ✅ Testing Phase 4

**Manual — this phase is user-facing, so click through it:**

| Check | Expected |
|---|---|
| Sign in with a `@tcetmumbai.in` Google account | Works, correct role |
| Sign in with a personal `@gmail.com` account | **Rejected** |
| Log into TNP, then open the coding portal | Already logged in |
| Trigger a password-reset OTP | Arrives within a minute |
| Send an all-students broadcast, then request an OTP | OTP still arrives (quota not exhausted) |
| Upload ISE marks, open a student | Marks shown |
| Download a grade card | PDF correct |
| Guardian report | Correct student, correct guardian |

**Automated:**
```bash
docker exec t_and_p_automation-api-1 pytest -q
```

**✅ Phase 4 is done when:** a student signs in with their college Google account, reaches the
coding portal without a second login, and downloads their grade card.

---

## Dependency graph

```
T-01..T-04  (breach)  ── independent, do today
T-05 ─► T-06 ─► T-07 ─► T-08 ─► T-09        Phase 1 — blocks everything below
                          └─► T-10 ─► T-11 ─► T-12, T-13, T-14, T-15
                                        │
        T-16, T-17 ─► T-18 ─► T-19 ─► T-20 ─► T-21, T-22, T-23     Phase 2
                        │
                        └─► T-24 ─► T-25, T-26 ─► T-27..T-33       Phase 3
                                                     │
                              T-34..T-37 ────────────┤             Phase 4
                                          T-38 ─► T-39, T-40, T-41
```

**Critical path:** T-05 → T-08 → T-10 → T-18 → T-24.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| T-18 attendance migration loses data | Medium | **Severe** | Back up; verification script; run on a copy; you verify |
| T-24 FK migration drops unmapped rows | Medium | **Severe** | Report unmapped values, never auto-drop |
| Agent verifies its own migration | Medium | **Severe** | Rule 2 — agent stops after writing the script |
| T-12 locks a real user out | Low | High | Confirm the admin list first |
| Agent widens a permission to pass a test | Medium | High | CLAUDE.md rule 5; you review all 🟡/🔴 |
| Agent edits models without a migration | Medium | Medium | `makemigrations --check` in CI (T-06) |
| Schema verified on SQLite, breaks on MySQL | High | Medium | T-05 first |
| Breach worsens before T-01/T-02 | — | **Severe** | Do it today |

---

*Derived from the audit of commit `ceeeb43`. Update the phase table and each task's Status as
work completes.*
