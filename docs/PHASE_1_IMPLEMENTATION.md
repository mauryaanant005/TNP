# Phase 1 — Secure & Stabilise · implementation record

**Goal:** stop the data breach, get a safety net, make authorisation mean something.
**Status:** ✅ engineering complete · ⛔ **breach containment (T-01 · T-02 · T-03) still open — yours, not an agent's**

Companions: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) · [`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md) ·
[`PERMISSIONS.md`](PERMISSIONS.md) · [`AGENTS_PROMPT.md`](AGENTS_PROMPT.md)

---

## The headline

The permission matrix test **failed 174 of 716 cases on its first run**, then went green after
T-10/T-11. That number is the point of the phase: 174 individual role/endpoint combinations were
behaving differently from how anyone would have described them, and none of them were visible
without a test.

```
first run   174 failed, 542 passed
after fixes   0 failed, 748 passed        (SQLite)
              0 failed, 748 passed        (MySQL — the engine production runs)
```

---

## What shipped

| Task | | What was done |
|---|---|---|
| T-01 | ⛔ | **Not done — yours.** Make the repo private. |
| T-02 | ⛔ | **Not done — yours.** Purge `*.xls*` / `*.csv` from git history. Destructive, one-shot, not delegable. |
| T-03 | ⛔ | **Not done — yours.** Escalate internally. A disclosure decision is not an engineering one. |
| T-04 | ✅ | Ignore rules — was already done before this phase. |
| T-05 | ✅ | MySQL in dev. `DATABASE_ENGINE` switch; `docker-compose.dev.yml` runs MySQL 8 + bind-mounts the source. |
| T-06 | ✅ | pytest · pytest-django · factory-boy · `tests/` package · `test_settings.py` · GitHub Actions. |
| T-07 | 🟡 | [`docs/PERMISSIONS.md`](PERMISSIONS.md) — **needs your approval.** 5 open questions at the bottom. |
| T-08 | ✅ | 716-case matrix test. Failed first, as designed. |
| T-09 | ✅ | 24 characterisation tests over eligibility and categorisation. |
| T-10 | ✅ | `base/permissions.py` — one `HasRole`, one `ROLES` table, one `DepartmentScopedMixin`. |
| T-11 | ✅ | 19 `IsAdminUser` sites and ~20 inline role checks removed. |
| T-12 | ⛔ | **Not done — yours.** Strip `is_staff` from the 16 non-admin accounts. Affects real people's access. |
| T-13 | ✅ | `<RequireRole>` on all 10 route groups (previously **zero** guards). |
| T-14 | ✅ | Rate limit keyed per account, not per shared proxy IP. |
| T-15 | ✅ | Global DRF pagination + the three frontend call sites that expected bare arrays. |

---

## Bugs found while doing this

Four were not in the audit. They were found because the matrix test forced every
role/endpoint pair to be stated explicitly.

### 1. Department coordinators could never upload attendance — 403, always

`AttendanceViewSet` required `role == "department_coordinator"` via its permission class, then
called `get_department_coordinator()`, which returned a responsibility **only when
`role == "faculty"`**:

```python
def get_department_coordinator(self):
    if self.request.user.role == "faculty":       # ← can never be true here
        return FacultyResponsibility.objects.filter(user=user).first()
    return None
```

The two conditions were mutually exclusive, so both upload endpoints returned
`403 "Access restricted for your role"` unconditionally. Not a permissions bug — a dead feature.

### 2. `program_coordinator` could not send any notification

The role existed on the `User` model but had no entry in `ROLE_AUDIENCE_PERMISSIONS`, so
`ROLE_AUDIENCE_PERMISSIONS.get(user.role, set())` returned an empty set and every audience was
refused. Added, scoped to match `training_officer`. **This was a judgement call — say if it should
be narrower.**

### 3. `403` was doing two different jobs

"You may not do this" and "your account has no department assigned" both returned `403`. They are
different problems with different fixes, and conflating them also refused superusers, who
legitimately hold no `FacultyResponsibility` row. Missing-scope now returns `400`.

### 4. The rate limiter crashed without a proxy header

Naming `HTTP_X_FORWARDED_FOR` as `RATELIMIT_IP_META_KEY` — the obvious fix, and what the plan
suggested — makes django-ratelimit raise `ImproperlyConfigured` when the header is absent, and
`ValueError` when it holds more than one entry (Cloudflare **and** Traefik each append). Login
returned 500 to anything not behind the proxy, which includes local development. Resolution moved
to `base/ratelimit.py`.

> Note the shape of #4: the first four rate-limit tests all passed while login was 500ing, because
> every one of them set the header explicitly. The tests agreed with each other and with the code,
> and were all wrong together.

---

## Findings pinned, deliberately not fixed

These are in `tests/test_characterisation_*.py` marked ⚠️. They are **pinned as-is** — a Phase 2
refactor that changes them will fail the suite, which is what a characterisation test is for.
Fixing them is a decision, not a cleanup.

| # | Finding | Where it bites |
|---|---|---|
| 1 | `categorize()` returns `Category_1`…`Category_4`; `Student.current_category` accepts `Category 1`…`No category`. Underscore vs space, and a `Category_4` with no counterpart. | The rule engine writes a value that eligibility then matches on — and misses. **A student categorised by the engine is refused every drive.** T-29. |
| 2 | A student with the default `current_category = "No category"` falls off the end of the eligibility ladder and is ineligible for everything. | Any student never explicitly categorised. |
| 3 | Two `is_student_eligible` implementations disagree. `student/utils` refuses anyone with `joined_company=True`; `staff/utils` ignores the flag. | A student who has joined a job is filtered out of the apply flow but **still receives "you are eligible" broadcasts.** |
| 4 | Salary is compared against bare `5` and `10` with no unit anywhere. `JobOffer.salary` is a `CharField`, `StudentOffer.salary` a `Float`. | A company that enters `600000` is treated as a Super Dream offer whichever unit was meant. T-25. |
| 5 | `CategoryRule` ordering is `order_by("category")` — alphabetical on the label. | Renaming categories (T-29) silently reorders the ladder. |

**Finding 1 is the one to look at first.** It is a live correctness bug affecting who gets a job,
and it is invisible from the UI.

---

## Deliberate behaviour changes

Everything else in this phase preserves behaviour. These do not:

| Change | Before | After | Why |
|---|---|---|---|
| `/api/training_officer/get-avg-data/` | Any authenticated user, including a student | `training_officer` + `principal` | Audit finding #20 — college-wide training aggregates were unowned |
| `/api/internship/*` authz failures | `404 "Failed to find user"` | `403` | A 404 for "not allowed" lies to the client and logs nothing |
| `IsPlacementOfficerOrAdmin` | Also admitted any `is_staff` account | Role only | Same `is_staff` conflation as `/api/staff/`, one layer down |
| `upload-inhouse-internship` | Any faculty member with a department | `department_coordinator` | It bulk-creates internship acceptance records |
| Department scoping | `department__istartswith="IT"` — also matched `ITC` | `iexact "IT"` **or** `istartswith "IT-"` | Prefix collision between department codes |
| List endpoints | Every row | 50 per page | T-15 |

The department-scoping change is the one to watch. If a department code in your data is a strict
prefix of another (`IT` / `ITC`, `AI&DS` / `AI&DSA`), the old code leaked the longer into the
shorter. The new code does not — so a coordinator may see **fewer** students than before, and that
is the fix, not a regression.

---

## How this was verified

```bash
# 748 passed — SQLite
docker run --rm -v "$PWD:/app" -w /app -e ENV=DEV … --entrypoint pytest t_and_p_automation-api -q

# 748 passed — MySQL, the production engine (T-05's whole point)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql
docker run --rm --network t_and_p_automation_default … -e DATABASE_ENGINE=mysql --entrypoint pytest …

# No changes detected
… --entrypoint python t_and_p_automation-api manage.py makemigrations --check --dry-run

# tsc -b && vite build — passes
docker compose -f docker-compose.yml -f docker-compose.dev.yml build frontend
```

Test suite composition:

| File | Tests | What it protects |
|---|---|---|
| `test_permission_matrix.py` | 716 | Every role × every endpoint, against `docs/PERMISSIONS.md` |
| `test_characterisation_eligibility.py` | 17 | Who is eligible for a placement drive |
| `test_characterisation_categorisation.py` | 7 | Which category a student lands in |
| `test_rate_limit.py` | 8 | Nobody is locked out on launch day |

### What was **not** verified

- **No manual click-through.** The frontend compiles and the guards are wired, but nobody has
  logged in as each role and walked the UI. That is the manual gate in the plan — 15 minutes, and
  it is yours to run.
- **The route guards have no tests.** There is no frontend test runner in this project. `tsc`
  proves they compile, not that they redirect correctly.
- **Pagination against real volume.** Verified against factory data, not against your 1,400 rows.
- **Nothing was run against production.**

---

## Before Phase 2

**Blocking:**

1. **T-01, T-02, T-03.** Still open. Every day the repository stays public is another day of
   exposure, and none of it is delegable to an agent.
2. **Approve [`docs/PERMISSIONS.md`](PERMISSIONS.md).** It is now the spec *and* the test fixture —
   if a rule in it is wrong, 716 tests are enforcing the wrong thing. The five open questions are
   at the bottom of that file.
3. **T-12.** Confirm the admin list, then strip `is_staff` from the 16 non-admin accounts. Until
   then `/admin/` is still reachable by 10 faculty. Nothing in the API reads the flag any more, so
   this is now safe to do — but it affects real people's access, so it needs your eyes.

**Run the manual gate** in `IMPLEMENTATION_PLAN.md` § *Testing Phase 1*. Two rows in it should now
behave the **opposite** of how they did before:

| Check | Was | Should now be |
|---|---|---|
| `role="staff"` user opens placement companies | `403` | **Works** |
| `faculty` user opens `/admin/` | `200` | **Blocked** — *after T-12* |

**Worth deciding, not blocking:** characterisation finding #1. It is a real bug with real
consequences and it is scheduled for T-29, three weeks out. If students are being refused drives
today, it should not wait.
