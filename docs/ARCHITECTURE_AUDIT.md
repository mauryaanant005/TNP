# TNP Portal — Architecture Audit & Migration Plan

**Audited:** 6 Aug 2026 · **Target commit:** `ceeeb43`
**Scope:** full repo — 8.9k LOC backend, 23k LOC frontend, 60+ endpoints, 11 roles
**Method:** static review + live probing against a running stack with 1,420 seeded students
**Execution model:** AI coding agents (not a human dev team) — the plan in §7 is written for that

---

## TL;DR

**Keep Django. Change the module boundary.**

The framework was never the problem. The problem is that **apps are organised by *role* instead
of by *domain***, and every other defect in this document descends from that one decision.

```
department_coordinator    0 models, 551 LOC of views
faculty_coordinator       0 models, 150 LOC of views
training_officer          0 models, 101 LOC of views
placement_api             empty — a dead app with only a migrations/ folder
```

Those are role-shaped shells with no data of their own, all reaching into other apps' models.
**9 files across 7 apps touch training attendance.** That is why there are 5 overlapping
attendance models, 3 competing authorisation mechanisms, and 3 spellings of "category" — each
role app grew its own copy of the same concept.

Rewriting in FastAPI or Node would carry this exact mistake into a new language, and cost you
the two things this project actually depends on (Excel ingestion, PDF generation). See §3 for
the alternatives assessed honestly.

| Foundation | State | Fix now | Fix in 12 months |
|---|---|---|---|
| **Module boundary** (role→domain) | Root cause of everything below | ~1 week | Touches every file |
| **Authorisation** | 3 mechanisms, provably broken both ways | ~3 days | Re-audit 60+ endpoints |
| **Data model** | No FK integrity, numbers-as-strings, 5 attendance tables | ~2 weeks | Migrate 8 batches of live data |
| **Tests** | Effectively zero (274 real LOC of 32k) | Must be **first** | Every agent change is a coin flip |

**Revised estimate for agent execution: ~3–4 weeks**, not the 8–10 a human team would need.
But the ordering changes — tests move to Phase 1, not "alongside".

**One item is not a refactor. It is a live data breach — §1.**

---

## 1. 🔴 CRITICAL — Real student data is public on GitHub

Unrelated to code quality, and the only item on this list that is urgent in hours rather than
weeks.

**Confirmed via the GitHub API:** `github.com/mauryaanant005/TNP` →
`"visibility": "public", "private": false`, public since `2026-07-22`.

**Tracked in that public repo** (`git ls-files`):

```
Students Placement Register Batch-2024 14112024.xls
Students Placement Register Batch-2025 10042026.xlsx   ← 1,356 real students
Students Placement Register Batch-2026 30052026.xls
Students Placement Register Batch-2027 07072026.xls
TNP FAculty List.xlsx
```

Confirmed column headers in the 2025 register:

> `Sr.No. | Branch Div | T&P UID | Student Name | Date of Employer Visit | Employer Category |
> Type of Placement | Employer Name | Stipend offered during PLI | **Salary offered for
> Placement** | No. of Offers | Dual Offer`

~5 MB of named students tied to employers and **salary figures**, publicly downloadable, across
four batches. Under the DPDP Act 2023 this is a reportable personal-data breach.

They were also missing from `.dockerignore`, so they were baked into every image built.

### Actions

| # | Action | Who | Notes |
|---|---|---|---|
| 1.1 | **Make repo private** | You, now | One click. Stops the bleeding. |
| 1.2 | Purge from history via `git filter-repo --path-glob '*.xls*' --invert-paths`, force-push | **You, not an agent** | Destructive + one-shot. Deleting in a new commit is *not* enough. |
| 1.3 | Escalate internally | You | Disclosure is a policy decision, not an engineering one. |
| 1.4 | ~~Add data globs to `.gitignore` / `.dockerignore`~~ | ✅ **Done** this session | Prevents recurrence; does **not** untrack existing files. |

> ✅ Already applied: `*.xls`, `*.xlsx`, `*.csv`, `local_data/` in both ignore files, plus
> `delete_students.py` / `reset_passwords_temp.py` excluded from the image.
> ⚠️ The 7 existing files are **still tracked**. 1.2 is still required.

*In fairness:* `.env` is correctly untracked and there are **no hardcoded secrets** in the tree.
The README already warns about rotating leaked credentials — that instinct was right, it just
wasn't applied to the far more sensitive data sitting beside them.

---

## 2. 🔴 The root cause — apps are organised by role, not domain

Everything in §4 and §5 is a symptom of this. Fix it first and the rest becomes mechanical.

### 2.1 The evidence

| App | Models | Views LOC | What it actually is |
|---|---|---|---|
| `placement_officer` | 1 | 498 | Reports over *other* apps' models |
| `department_coordinator` | **0** | 551 | Pure views over `student` + `program_coordinator_api` |
| `faculty_coordinator` | **0** | 150 | Pure views over `program_coordinator_api` |
| `training_officer` | **0** | 101 | One aggregation view |
| `program_coordinator_api` | 7 | 883 | Where all training data accidentally landed |
| `staff` | 3 | 379 | Placement companies (domain-shaped, misnamed) |
| `placement_api` | 0 | — | **Dead app**, migrations folder only |

Four apps own **zero models**. They are named after job titles, so they became dumping grounds
for "whatever that role needed", duplicating each other.

### 2.2 The consequence, made concrete

Files touching training attendance — **9 files, 7 apps**:

```
program_coordinator_api/{models,views}.py     ← 5 attendance models live here
department_coordinator/views.py                ← its own upload_attendance
faculty_coordinator/views.py                   ← its own save/get/reset_attendance
training_officer/views.py                      ← its own aggregation
student/{models,views}.py                      ← its own read path
staff/views.py, placement_officer/views.py     ← read it again for reports
```

That is the mechanism that produced `AttendanceData`, `BatchAttendance`,
`SimpleAttendanceData`, `AttendanceRecord` and `Program1` — five models for one concept. Nobody
designed that. It accreted because there was no *owner* for "attendance", only consumers.

Same mechanism, same outcome, three more times:
- **Authorisation** → each role app invented its own check (§4)
- **Category** → three incompatible spellings (§5.7)
- **Adding a role** → currently means adding an app

### 2.3 Target structure — domain apps, roles as data

```
config/          # settings, urls, celery, asgi          (rename of t_and_p_automation/)
accounts/        # User, RoleAssignment, OTP, Google OAuth
                 #   permissions.py  ← THE single authorisation layer
institution/     # Department, Batch, AcademicYear, Program, Semester   (reference data)
students/        # Student, Resume, Guardian
academics/       # AcademicPerformance (ISE marks), AcademicAttendance, GradeCard
training/        # TrainingSession, SessionAttendance, TrainingPerformance
placements/      # Company, Drive, JobOffer, Application, SelectionRound, StudentOffer
internships/     # InternshipCompany, Offer, Application, Acceptance
notifications/   # already domain-shaped — keep
reports/         # read-only aggregation layer for every dashboard
```

Each app owns its models, services, serializers, views, urls and tests.
**Roles become data + policy, never module boundaries.** A new role (Dean, Guardian, recruiter)
becomes a row and a permission entry — not a new app.

### 2.4 Add a service layer

Business logic currently lives in views (883 LOC in one `views.py`). Move it to `services.py` as
plain functions:

```python
# training/services.py
def record_session_attendance(session: TrainingSession, rows: list[AttendanceRow]) -> Result: ...

# placements/services.py
def eligible_students(drive: Drive) -> QuerySet[Student]: ...
```

Views become thin HTTP adapters. This matters *more* under agent execution: an agent can write
and test a pure function without spinning up HTTP, auth, or serializers — far fewer moving parts
to get wrong.

---

## 3. Should you change backend? — assessed honestly

You asked. I looked at it properly rather than defending the incumbent.

| Option | Real advantages | Real costs **here** | Verdict |
|---|---|---|---|
| **Django + DRF** *(keep)* | pandas/openpyxl for Excel; WeasyPrint for PDFs; admin for 11 roles free; best-in-class migrations; densest agent training data | Sync by default; ORM verbose | ✅ **Keep** |
| **FastAPI + SQLModel** | Async, typed, fast | Rebuild admin, auth, migrations, import/export from scratch | ❌ |
| **NestJS / Node + Prisma** | Shared TS types with your React app; excellent migrations | Excel + PDF + scheduled-report ecosystem is far weaker — that *is* your workload | ❌ |
| **Supabase / PocketBase** | Row-Level Security would model role scoping elegantly; less code overall | Bulk Excel ingest, Celery jobs, PDF generation don't fit; you'd still need a Python service alongside | ❌ |

**The decisive factor is your actual workload.** This portal is, in practice, an *Excel-in,
PDF-out* system: coordinators upload spreadsheets, officers download reports, students download
resumes and (soon) grade cards. That is Python's home turf — `pandas`, `openpyxl`,
`django-import-export`, `WeasyPrint` are already wired up and working.

**The agent-specific argument reinforces it.** Every line an agent doesn't have to write is a
line it can't get wrong. Django hands you admin, auth, sessions, migrations and the ORM for
free. A "modern" stack means an agent hand-rolling all four — a much larger generated surface,
in a stack with thinner training data. Idiomatic Django is close to the highest-confidence code
an agent can produce.

### 3.1 "But a SOTA agent could just rewrite it" — a fair challenge

An earlier draft of this section argued a rewrite's real cost was an agent *re-deriving*
undocumented business rules. **That was overstated and is now corrected.** The existing code
*is* the spec — porting `is_student_eligible()` is translation, not derivation, and a capable
model does that reliably. 8.9k LOC is genuinely small.

The arguments *for* a greenfield backend are stronger than that draft admitted:

- **Phases 3–4 are already a rewrite.** T-16 … T-31 move every file and reshape every table.
  The disagreement is about *method*, not scope.
- **Greenfield lets you design the schema right** instead of reaching it through nine
  compatibility-constrained migrations.
- **Tests are easier to write for clean code** than characterisation tests for 883-line views.

What genuinely does *not* go away in a rewrite:

- **The data.** Four batches of live students, offers and salaries still need an ETL into the
  new schema. That is T-19/T-23 either way — the risk moves, it doesn't vanish.
- **The frontend.** 23k LOC, 176 files. Changing every endpoint contract at once means the whole
  React app churns simultaneously, with no working system in between.
- **Undocumented I/O quirks.** UID→batch parsing, column-name variants in real spreadsheets,
  casing drift in departments. These live in messy code *and* in the actual files. A port passes
  review and then fails on next year's spreadsheet.
- **It is deployed and in use** (`175.175.0.229`). Big-bang cutover means running two systems.

### 3.2 The resolution — strangler fig, which is what the plan already is

The useful question is not *rewrite vs refactor*, it is **how much of the rewrite is already in
the plan** — and the answer is most of it. So adopt the rewrite's *method* without its risk:

> **Write each new domain app clean, port the logic across, delete the old app when it is empty.**

Concretely, for T-20/T-21 the agent should **not** incrementally edit a 551-line role app.
It should write `training/` fresh — clean models, services, tests — port the behaviour, point
the URLs at it, and delete `faculty_coordinator/`. That yields genuinely greenfield code, one
domain at a time, while:

- a working system exists at every step,
- characterisation tests (T-08) prove old and new agree,
- data migrates in verified slices rather than one ETL,
- the frontend switches per-endpoint via the generated client (T-14), not all at once.

You get ~90% of the rewrite's cleanliness for ~20% of its risk. **This changes how the tasks are
executed, not which tasks they are** — the plan is annotated accordingly.

### 3.3 Database

**Recommendation: keep MySQL in production; fix the dev/prod mismatch.**

The live problem is not the engine, it is that **dev runs SQLite and production runs MySQL**.
They differ in constraint enforcement, JSON operators, string collation and casing — so a
migration can pass locally and fail in production, and an agent gets a false green.

**Fix:** run MySQL in `docker-compose.override.yml` for local dev (T-48). Costs one container
and removes a whole class of "works locally" failures.

PostgreSQL would be modestly better (richer `CHECK` constraints, partial indexes, real JSON
operators — all useful for §6), but MySQL is IT-managed and 13 M rows is comfortable for either.
Not worth fighting for; take it if offered.

### 3.4 Should auth be a separate open-source identity provider?

Assessed, because unified login across TNP + the coding portal is a stated goal.

| Option | Cost on a college server | Verdict |
|---|---|---|
| **Keycloak** | JVM, ~1 GB RAM, own DB. Heavyweight admin UX. | ❌ over-engineered here |
| **Authentik** | Python, but needs its own Postgres **and** Redis; ~1 GB+ | ❌ for 2 apps |
| **Zitadel** | Go, lighter, needs Postgres | 🟡 if you reach 3+ apps |
| **`django-oauth-toolkit`** — TNP *is* the OIDC provider | **Zero new containers.** Django already owns the user table. | ✅ **when you need OIDC** |
| **Shared session cookie** on `.tcetmumbai.in` | Zero infrastructure, zero code | ✅ **start here** |

**Recommendation: do not run a separate IdP.**

Three reasons specific to your situation:

1. **Your authorisation cannot live there anyway.** Roles, `FacultyResponsibility`, department
   and program scoping are Django domain data. An IdP would own *authentication* only — you would
   still maintain the entire permission layer in Django, plus a user-sync job between the two.
   That is more moving parts, not fewer.
2. **It becomes a single point of failure you now operate.** If the IdP container is down, nobody
   logs in to anything — on hardware you maintain, without a platform team.
3. **Two apps on one parent domain do not need federation.** `SESSION_COOKIE_DOMAIN =
   ".tcetmumbai.in"` gives unified login today for one settings line (T-33).

**When to revisit:** at a third consumer, a non-Django app, or an external partner needing
delegated access — then add `django-oauth-toolkit` and make TNP the provider. Still no new
container, and no user sync, because the user table never moves.

Google OAuth (T-32) is orthogonal and worth doing regardless: `django-allauth` restricted to your
Workspace domain removes password management for ~1,400 students without any of the above.

**Frontend:** React + Vite + TS stays. Add a **generated API client** (§7, T-14) — with
`drf-spectacular` producing an OpenAPI schema and a typed TS client generated from it, an agent
*cannot* invent an endpoint shape or drift a field name. That single change removes the largest
category of agent error in a split frontend/backend repo.

---

## 4. 🔴 Authorisation — broken in both directions, proven live

Authentication is fine: Django sessions, correct cross-origin cookies, single-use OTP with no
user-enumeration oracle. **Authorisation is the problem** — and it is a direct symptom of §2.

Three competing mechanisms, no source of truth:

| Mechanism | Where | Count |
|---|---|---|
| DRF permission classes | `base/permissions.py`, `department_coordinator/views.py` | 2 classes |
| Inline `if user.role != "x"` in view bodies | 6 apps | ~20 sites |
| `IsAdminUser` (Django's `is_staff` flag) | `staff/`, `program_coordinator_api/` | 19 sites |

### 4.1 The `is_staff` conflation — verified on the running stack

`/api/staff/*` gates on `IsAdminUser`, which checks `is_staff`. But `CustomUserManager
.create_user` **never sets `is_staff`** — only `create_superuser` does.

```
role='staff' user   → /api/staff/placement/company/   403   ← locked out of their own module
role='staff' user   → /api/staff/category_update/     403
faculty (is_staff)  → /api/staff/placement/company/   405   ← authorisation PASSED
faculty (is_staff)  → /api/staff/companies/batches/   200
faculty (is_staff)  → /admin/                         200   ← django-unfold panel loads
```

**A faculty user passes where a real staff user is denied.** The workaround applied was flipping
`is_staff=True` on **16 non-superuser accounts — including 10 faculty**, plus the training,
placement and internship officers.

*Calibrated:* those 16 hold **0 model permissions and 0 groups** (`Group.objects.count() == 0`),
and `student/admin.py` scopes its queryset by department — so the admin panel loads but exposes
no editable data. The escalation is **latent, not currently exploitable**. The cross-role *API*
access is live today.

This is the same bug class as the `IsDepartmentCoordinator` check fixed earlier this session
(compared against `"faculty"`, actual role `"department_coordinator"`). Two instances of one
pattern is architecture, not typos.

### 4.2 Frontend routes are entirely unguarded

```bash
$ grep -rn "role" client_app/src/routes/     # → no matches, all 10 files
```

Acceptable only if the API is a complete boundary. Per §4.1 it isn't — so today neither layer is
complete.

### 4.3 Genuine gap

`/api/training_officer/get-avg-data/<table>/` — no role check, no scoping. Any authenticated user
including a student receives college-wide training aggregates by branch/division/year. Aggregate
rather than individual PII, so moderate — but unowned.

### 4.4 What is already right — copy these

- **`placement_officer/`** — 13 endpoints, one consistent `IsPlacementOfficerOrAdmin`. The model
  to follow.
- **Student self-service** — every endpoint scopes via `Student.objects.get(user=request.user)`.
  I probed specifically for IDOR and found none.
- **`StudentAnalyticsViewSet`** — fails closed with `Student.objects.none()` when the user has no
  `FacultyResponsibility`. *(My first pass flagged this as a leak; it is not. It returns
  `200 []` instead of `403` — a UX wart, not a vulnerability.)*

---

## 5. 🔴 Availability — the rate limit breaks on launch day

```python
@ratelimit(key="ip", rate="5/m", method="POST", block=True)   # login
@ratelimit(key="ip", rate="3/h", method="POST", block=True)   # password reset
```

`key="ip"` reads `REMOTE_ADDR`. Behind Traefik + Cloudflare Tunnel — your documented production
topology — **every user arrives with the proxy's IP**. `SECURE_PROXY_SSL_HEADER` is set for
protocol only; nothing tells Django to trust `X-Forwarded-For` for the client address.

**Effect: 5 logins per minute for the entire college; 3 password resets per hour
institution-wide.** With 1,400 students during a placement drive, effectively everyone is locked
out.

Not theoretical — I triggered it during this audit with ordinary curl testing and received `403`
on valid credentials until the window expired.

```python
# config/settings.py — only valid because Traefik is the sole ingress (compose publishes no ports)
RATELIMIT_IP_META_KEY = "HTTP_X_FORWARDED_FOR"

# accounts/views.py — limit the account, not the shared egress IP
@ratelimit(key="post:email", rate="5/m", method="POST", block=True)
@ratelimit(key="ip",         rate="100/m", method="POST", block=True)   # coarse abuse backstop
```

⚠️ `X-Forwarded-For` is spoofable if the container is ever directly reachable. Your compose file
publishes no ports, so this holds — re-check if that changes.

---

## 6. 🟠 Data model — the expensive, load-bearing work

Cheap now at 4 batches; painful at 8. All of this is downstream of §2.

### 6.1 Broken referential integrity

```python
class InternshipApplication(models.Model):
    student = models.CharField(max_length=100)                        # a FK as free text
    company = models.ForeignKey(..., on_delete=models.DO_NOTHING)     # orphan rows
```

The same logical key — student UID — has **three types**:

| Model | Field | Type |
|---|---|---|
| `Student` | `uid` | `CharField` |
| `AttendanceData` | `uid` | `CharField` (no FK) |
| `SimpleAttendanceData` | `uid` | `IntegerField` |
| `InternshipApplication` | `student` | `CharField` |

Joins therefore happen in Python dicts, not SQL — see `training_officer/views.py` building a
`student_map` in memory. That is why reports are slow.

### 6.2 Numbers and dates stored as strings

```python
CompanyRegistration.min_cgpa                = CharField(max_length=10)   # eligibility!
CompanyRegistration.min_tenth_marks         = CharField(max_length=10)
JobOffer.salary                             = CharField(max_length=50)
InternshipNotice.date                       = TextField()
Resume_WorkExperience.start_date/end_date   = TextField()
```

*"Students with CGPA ≥ this company's minimum"* cannot be expressed in SQL — the hottest query
path in a placement portal runs in Python over the full table.

Money is `FloatField` (`StudentOffer.salary`, `InternshipAcceptance.salary`). Use `Decimal`;
float rounding on salary in a legal record is indefensible.

### 6.3 Five overlapping attendance models

`AttendanceData`, `BatchAttendance`, `SimpleAttendanceData`, `AttendanceRecord`, `Program1` —
one concept, five tables, no owner (§2.2). Worst of them:

```python
class AttendanceRecord(models.Model):
    student_data = models.JSONField(default=list)   # the actual attendance — unqueryable
```

Core data in a JSON blob: no index, no SQL aggregation, no joins. And `Program1` is a literal
model name with `UID`, `Name`, `Branch_Div`, `Year` as PascalCase columns.

### 6.4 No reference tables

`department`, `batch`, `academic_year`, `division`, `program` are free-text `CharField`s across
~10 models. One typo creates a phantom department that silently breaks reports. The code already
compensates with `__iexact`, `.strip()`, `__startswith` prefix-matching — all symptoms of a
missing `Department` table.

### 6.5 No audit trail

`Student`, `StudentOffer`, `CompanyRegistration`, `JobOffer`, `Notice` have **no
`created_at`/`updated_at`** and no record of who changed what — on legally significant offer and
salary records. `TrainingPerformance` gets it right (`uploaded_by`, `uploaded_at`); extend that
everywhere.

### 6.6 Hardcoded recruitment rounds

```python
class PlacementCompanyProgress(models.Model):
    aptitude_test = BooleanField(); coding_test = BooleanField()
    technical_interview = BooleanField(); hr_interview = BooleanField(); gd = BooleanField()
```

Cannot represent "3 technical rounds" or "case study". Needs
`SelectionRound(drive, order, name)` + `StudentRoundResult`.

### 6.7 Three competing category systems

| Where | Values |
|---|---|
| `Student.current_category` | `Category 1 / 2 / 3 / No category` |
| `CategoryRule.category` | `Category_1 … Category_4` |
| `Student.card` | `Green / Yellow / Orange / Red` |

The rule engine's output format doesn't match the field it writes into, and `card` duplicates the
concept a third time.

### 6.8 Confirmed live bugs (executed against the running stack)

```
1. TrainingPerformanceCategory.__str__ → AttributeError:
   'TrainingPerformance' object has no attribute 'uid'      (breaks admin list views)
2. SEM_OPTIONS[6] == ('Semester 7', 'Semester 8')           (value/label mismatch)
3. InternshipAcceptance.save() raises ValueError            (HTTP 500, not a 400)
```

Also: `Student.user` is `on_delete=SET_NULL` → orphan student rows; `Student.cgpa`/`attendance`
duplicate the per-semester tables and will drift.

---

## 7. Implementation plan

**The full task-by-task plan lives in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)** —
41 tasks across **4 phases**, each with a scope, an acceptance check and a review level. Keep it
as the single source of truth; do not duplicate task detail here.

**Four phases, four test cycles** — each ends with a gate you run yourself, rather than
per-task verification:

| Phase | What | Tasks | Covers |
|---|---|---|---|
| **1** — Secure & Stabilise | Stop the breach, add tests, fix authorisation | T-01 … T-15 | §1, §4, §5 |
| **2** — Restructure | Domain apps, one attendance model (strangler fig, §3.2) | T-16 … T-23 | §2 |
| **3** — Schema correctness | Types, FKs, audit trail, deployment defaults | T-24 … T-33 | §6, §9 |
| **4** — Features | OAuth, unified login, ISE marks, grade cards | T-34 … T-41 | — |

**Critical path:** T-05 → T-08 → T-10 → T-18 → T-24.

Scale concerns (§9) are folded in as ordinary tasks rather than a separate phase — indexes ship
with the attendance migration (T-18), pagination in Phase 1 (T-15), deployment defaults in
Phase 3 (T-32).

### Two rules that outrank every task

1. **Tests land before refactors.** Not alongside. With no tests neither a human nor an agent
   can refactor safely — but an agent will additionally produce a confident, plausible, subtly
   wrong diff that reads fine on review. T-07 is designed to *fail* on first run, reproducing
   the known `staff` authorisation bug; if it passes immediately, the test is wrong.
2. **An agent never confirms its own data migration.** It writes the migration *and* a
   verification script, then stops. A human runs it against a copy and reads the row counts.
   This applies specifically to **T-19** (five attendance models → one) and **T-23** (free-text
   → foreign keys), the two highest-risk tasks in the plan.

---

## 8. Guardrails for agent execution

Without these, every new session re-derives your conventions and reintroduces exactly the
inconsistencies this audit is about — that is literally how three auth mechanisms happened.

1. ✅ **[`CLAUDE.md`](../CLAUDE.md) at repo root** — *created.* Permission rules, schema
   conventions, app boundaries, the "never commit spreadsheets" rule. Loaded every session.
2. **`docs/PERMISSIONS.md`** (T-06) — the permission matrix. Doubles as spec and test fixture.
3. **CI on every push** — `pytest` + `makemigrations --check --dry-run` (catches models edited
   without a migration, a very common agent slip).
4. **One task per session.** These tasks are sized deliberately. "Do Phase 3" in one go produces
   an unreviewable diff.
5. **Never let the agent verify its own data migration.** It writes the verification script; you
   run it on a copy and read the numbers.

---

## 9. Does the target design hold at 10,000 students?

**Short answer: yes structurally, but the plan as first written had six gaps that only bite
above ~3,000 students.** They are now tasks T-40 … T-47. This section is a critical review of
§2's target design, not a defence of it.

### 9.1 Row-count maths

The biggest table in the target design is `SessionAttendance` (T-19):

```
10,000 students × 40 sessions × 4 programs × 2 semesters   ≈  3.2 M rows / year
× 4 year-groups retained                                   ≈   13 M rows
```

13 M rows is **routine** for MySQL or Postgres — it is not a scale problem. It is only a problem
without indexes, and today the entire codebase declares **5 `db_index=True` in total**. The
current JSON-blob design (`AttendanceRecord.student_data`) is far worse: one row holding every
student's attendance for a program, deserialised into Python memory on **every** read. At 10k
that single row is tens of MB. Normalising it (T-19) is what makes 10k possible at all.

### 9.2 Six gaps in the plan — now fixed as tasks

| # | Gap | Bites at | Task |
|---|---|---|---|
| 1 | **No indexing strategy.** T-19 creates the largest table in the system and never specifies its indexes. Without `(student_id, session_id)` and `(session_id)` every dashboard aggregate is a full scan. | ~3k | **T-40** |
| 2 | **`reports/` was hand-waved** as a "read-only aggregation layer". Live aggregation over 13 M rows per dashboard load is too slow. Needs Celery-refreshed summary tables + Redis. Redis is already configured as a cache and currently **unused**. | ~5k | **T-41** |
| 3 | **`Notification.recipients` M2M** was finding #23 with no corresponding task. One "all students" broadcast writes 10,000 through-table rows; 200/year ≈ 2 M rows plus a slow fan-out. The targeting metadata to compute recipients at read time already exists. | ~2k | **T-42** |
| 4 | **No global pagination.** Only 2 apps paginate. Any unpaginated list endpoint returns 10,000 rows. | ~1k | **T-43** |
| 5 | **Synchronous Excel import.** A 10,000-row upload will exceed Gunicorn's timeout. Celery is running and under-used. | ~2k | **T-44** |
| 6 | **Deployment defaults unset.** `CONN_MAX_AGE` unset (new DB connection *per request*), DB-backed sessions, Gunicorn workers hardcoded to 3. | concurrency, not data | **T-45, T-46** |

### 9.3 The vibecoding-specific gap

There is a seventh, and it is the one most likely to actually hurt you.

**Nothing in the plan stops an agent from writing an N+1 query or an unindexed filter.** Agents
are reliably bad at this — they produce idiomatic, correct-looking ORM code that issues one query
per row. At 1,400 students nobody notices. At 10,000 it is a timeout.

This is a *silent* failure mode: tests pass, review looks clean, and the regression only appears
under production data volume. Guard it mechanically — **T-47** adds `assertNumQueries` around
list endpoints and `nplusone` in CI, so a query-count regression fails the build instead of
reaching production.

### 9.4 Is the design good *for agent execution*?

Yes — and materially better than the current one:

| Property | Now | Target | Why it matters to an agent |
|---|---|---|---|
| Largest `views.py` | 883 LOC | < 150 LOC (T-22) | Fits in working context; whole-file reasoning |
| Owners of "attendance" | 7 apps, 5 models | 1 app, 1 model | An agent cannot pick the wrong one, or add a 6th |
| Authorisation sites | 3 mechanisms, ~41 places | 1 class, declarative | `grep` answers "who can do what" |
| API contract | Hand-written both sides | Generated types (T-14) | Agent cannot drift a field name |
| Business logic | Inside views | `services.py` (T-22) | Testable without HTTP/auth/serializers |

The current structure actively fights agents: told to "fix attendance", an agent finds five
models across seven apps and picks one — probably the wrong one. That is not hypothetical; it is
how the five models got there.

### 9.5 Verdict

The **architecture** scales to 10,000 — the domain-app boundary, normalised attendance, service
layer and permission class are all correct at that size and well beyond. Django comfortably runs
institutions far larger than TCET.

What needed fixing was the **plan**, not the design: it optimised for correctness and said
nothing about volume. With T-40 … T-47 added, 10,000 students is a capacity-planning exercise
(indexes, caching, workers), not an architectural one.

> **Caveat worth stating plainly:** these are desk-review conclusions from row-count maths and
> config inspection, not load tests. Before you actually onboard 10k, run one load test against
> seeded data at target volume. The design will hold; the *defaults* are what will surprise you.

---

## 10. What is genuinely good

- **Docker** — multi-stage, non-root `django` user, healthchecks, WhiteNoise, Gunicorn +
  Uvicorn worker for ASGI/WebSockets. Correct for deploying on the college server.
- **Dependencies fully pinned** — reproducible builds.
- **Security headers** — CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, COOP,
  `NoCacheMiddleware`.
- **Centralised API client** — `client_app/src/lib/api.ts`, 96 uses vs 3 raw `fetch` calls.
- **No hardcoded secrets**; `.env` correctly untracked.
- **OTP reset is sound** — single-use, invalidated after verify, identical response whether or
  not the account exists.
- **Recent refactors** (`hooks.ts`, `ErrorBanner.tsx`, `api.ts`, `base/permissions.py`) show
  exactly the right instincts.

The foundations are wrong. The craftsmanship on top of them is not.

---

## Appendix — findings index

| # | Sev | Finding | Evidence |
|---|---|---|---|
| 1 | 🔴 | Student PII + salaries public on GitHub | GitHub API `private:false`; `git ls-files` |
| 2 | 🔴 | **Apps organised by role, not domain** — root cause | 4 apps with 0 models; 9 files/7 apps touch attendance |
| 3 | 🔴 | `is_staff` ≠ role: staff locked out, faculty let in | Live probe 403 vs 405/200 |
| 4 | 🔴 | 16 accounts hold `is_staff` incl. 10 faculty → `/admin/` 200 | Live probe |
| 5 | 🔴 | Rate limit on shared proxy IP → college-wide lockout | Reproduced during audit |
| 6 | 🟠 | 3 competing authz mechanisms | 2 classes + ~20 inline + 19 `IsAdminUser` |
| 7 | 🟠 | Frontend routes unguarded | `grep role client_app/src/routes/` → ∅ |
| 8 | 🟠 | Student UID has 3 types; FK as `CharField` | `internship_api/models.py` |
| 9 | 🟠 | Eligibility numbers + dates as strings | `staff/models.py`, `internship_api/models.py` |
| 10 | 🟠 | 5 overlapping attendance models; data in JSON blob | `program_coordinator_api/models.py` |
| 11 | 🟠 | No audit columns on offers/salaries | `student/models.py`, `staff/models.py` |
| 12 | 🟠 | No reference tables; free-text dept/batch | ~10 models |
| 13 | 🟠 | Money as `FloatField` | `StudentOffer`, `InternshipAcceptance` |
| 14 | 🟠 | Hardcoded recruitment rounds | `PlacementCompanyProgress` |
| 15 | 🟠 | 3 inconsistent category systems | `Student` vs `CategoryRule` |
| 16 | 🟠 | Effectively no tests | 274 real LOC of 32k |
| 17 | 🟡 | `TrainingPerformanceCategory.__str__` → AttributeError | Verified live |
| 18 | 🟡 | `SEM_OPTIONS[6]` value/label mismatch | Verified live |
| 19 | 🟡 | `save()` raises `ValueError` → HTTP 500 | `InternshipAcceptance` |
| 20 | 🟡 | `/api/training_officer/get-avg-data/` unscoped | Live probe: 200 as student |
| 21 | 🟡 | Ops scripts shipped in image | ✅ fixed in `.dockerignore` |
| 22 | 🟡 | Email send failures silently swallowed | `base/models.py` `except: pass` |
| 23 | 🟡 | `Notification.recipients` M2M explodes on broadcast | `notifications/models.py` |
| 24 | 🟡 | Dead `placement_api/` app | migrations folder only |

---

*Audit executed against commit `ceeeb43` on a live stack with 1,420 seeded students. Every*
*"verified" / "live probe" claim was run against the running containers; test accounts created*
*during probing were removed afterwards.*
