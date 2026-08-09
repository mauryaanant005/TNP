# Phase 2 — Restructure · implementation record

**Goal:** apps organised by domain, one attendance model instead of five.
**Status:** 🟨 **6 of 8 tasks done.** T-20 and T-21 remain — see
[Why the rest stopped here](#why-the-rest-stopped-here).

Companions: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) ·
[`PHASE_1_IMPLEMENTATION.md`](PHASE_1_IMPLEMENTATION.md) · [`AGENTS_PROMPT.md`](AGENTS_PROMPT.md)

```
921 passed   (SQLite)
921 passed   (MySQL — the production engine)
makemigrations --check --dry-run : No changes detected
manage.py check                  : no issues
npm run build (tsc -b && vite)   : built
```

---

## What shipped

| Task | | What was done |
|---|---|---|
| T-16 | ✅ | Dead `placement_api/` deleted. `t_and_p_automation/` → `config/`. |
| T-17 | ✅ | `institution/` — `Department`, `Division`, `Batch`, `AcademicYear`, `Program`, `Semester` + a seeder that reports typos instead of merging them. |
| T-18 | ⏸ | `training/` written, migration generated, backfill and verification script delivered — **and stopped there, unapplied.** Rule 2. |
| T-19 | ✅ | `placements/` — `staff/` and `placement_officer/` ported and emptied. Models moved with **zero DDL**; upgrade path verified on populated MySQL. Two dead features revived. |
| T-20 | ⬜ | `students/` + dissolve the role apps — not started; unblocked and now has T-19 as a worked example. |
| T-21 | 🟨 | Service layer — done for `placements/` (logic in `services.py`); `views.py` still needs splitting, and the other apps are untouched. |
| T-22 | ✅ | `drf-spectacular` at `/api/schema/`, 86 paths, typed TS client generated and CI-guarded against drift. |
| T-23 | ✅ | Notification recipients resolved at read time. Found and fixed a live N+1 on the way. |

---

## T-18 — prepared, not applied

**Nothing has been migrated. The five legacy models are untouched and still
authoritative.** What exists is the target schema plus the two tools you need to
decide whether to cut over.

### One deliberate departure from the plan

The plan says "the migration **and** `scripts/verify_attendance_migration.py`". I wrote the
backfill as a **management command, not a data migration** — because `entrypoint.sh` runs
`manage.py migrate --noinput` on every container start. A data migration would have applied
itself on your next deploy, to production, with nobody reading the output. That is the exact
opposite of what Rule 2 is for.

So:

```bash
# 1. against a COPY. Reports, writes nothing.
python manage.py backfill_attendance --dry-run

# 2. only after reading the report. Refuses to commit if any row would be skipped.
python manage.py backfill_attendance

# 3. separately, and this is the one that decides it
python scripts/verify_attendance_migration.py
```

`backfill_attendance` **refuses to commit** if a single row would be dropped, unless you pass
`--allow-skips`. A skipped row is a student whose attendance silently disappears, so the default
is to stop.

`verify_attendance_migration.py` compares per-student totals old vs new and exits non-zero on any
mismatch. **Expected: zero. Any mismatch → roll back, don't debug forward.**

### Two judgement calls to check

1. **`BatchAttendance` and `Program1` are not migrated.** They hold per-batch totals and
   per-student percentages — both derived from the per-student rows. Copying them would store the
   same fact in two places and let the copies drift, which is precisely how one concept became
   five models. They should be recomputed from `SessionAttendance` instead.
2. **`SimpleAttendanceData` has no program column at all.** Its rows cannot be attributed to a
   program without guessing, so they are **reported and skipped** rather than assigned to an
   arbitrary one. If that table has real data in it, you will see it in the report and will need
   to decide what those rows meant.

### What the tests do and do not prove

27 tests cover parsing, status normalisation, duplicate collapsing, the JSON-blob flattening, and
— the important ones — that an unknown UID, an unparseable session label and an unseeded program
are each **reported rather than dropped**.

They run on data I invented. **That is not evidence that 1,400 real students' attendance
survives.** Only the verification script against a copy of your database is.

---

## T-23 — the fan-out is gone

An "all students" broadcast wrote one through-table row per student. At target size that is 10,000
rows per broadcast, ~2M a year, to store something already fully determined by three columns the
model also stores.

Now `notifications/targeting.py` resolves recipients when somebody reads their inbox.
`NotificationRead` stays — read state is genuinely per-user.

**How this was verified.** A 50-case equivalence matrix asserts that the new read-time predicate
and the old write-time query select *identical* people across every audience × department × year
combination. That is the only verification that means anything for a change like this — the risk
is not that it crashes, it is that somebody quietly stops receiving notifications.

### A live N+1, found because of the guard

Adding a query-count guard to the endpoint I had just rewritten turned up a **pre-existing**
bug:

```python
def get_is_read(self, obj):
    # Uses prefetched queryset when available — avoids N+1
    return obj.read_by.filter(user=request.user).exists()
```

The comment is wrong. `.filter()` on a related manager builds a fresh queryset and **discards the
prefetch cache** — one query per notification. Measured: 5 notifications → 13 queries, 50
notifications → 58.

Fixed by prefetching only the requesting user's read rows into a dedicated attribute. Now flat at
13 queries for both. The whole suite got ~45% faster as a side effect, which tells you how often
that path runs.

This is exactly the failure mode the audit's §9.3 warns about: idiomatic, correct-looking ORM that
issues one query per row, invisible at current volume. It was sitting behind a comment asserting
it was fine.

---

## T-17 — the seeder reports, it does not tidy

`manage.py seed_institution --dry-run` creates one row per distinct value **including the typos**,
then flags near-duplicates:

```
POSSIBLE DUPLICATES - one of each pair is probably a typo.
  department     'AI&DS'  ~  'AI&DSA'
  department     'IT'     ~  'ITC'
```

Merging those changes which students belong to which department. That is your call, not the
seeder's — and it has to be made **before T-24** turns those columns into foreign keys.

The `IT` / `ITC` pair is the one to look at: `department__istartswith="IT"` also matched `ITC`
throughout the old code, so any report scoped that way has been over-reporting.

---

## T-22 — the frontend can no longer drift

`drf-spectacular` serves the schema at `/api/schema/` (browsable at `/api/schema/docs/`), and
`client_app/src/lib/generated/` holds the committed `schema.yaml` and the `api-types.ts` generated
from it.

**Both generated files are committed, and CI fails if either is stale:**

- `tests/test_api_schema.py` compares the committed `schema.yaml` against the live code — a
  serializer change nobody regenerated fails there.
- The frontend job regenerates `api-types.ts` and fails on any diff.

So a changed field name now breaks the build rather than reaching production as a silently wrong
key. The audit called this the largest single category of error in a split frontend/backend repo.

**Coverage is partial and that is the honest state:** 16 of the 86 paths generate a warning (69 of 83
before T-19 ported its views behind serializers),
nearly all function-based views returning a bare `JsonResponse` with no serializer to introspect.
Their responses appear untyped. That is a symptom of the structure T-19 … T-21 will fix, not of the
tooling — the warnings and the untyped responses disappear together as views move behind
serializers. `client_app/src/lib/generated/README.md` documents the `@extend_schema` escape hatch
for views that must stay function-based.

Nothing in the existing frontend has been rewritten to use the types yet. They are available;
adopting them call-site by call-site is incremental and safe, and is the natural companion to each
port.

---

## T-19 — `placements/`

`staff/` (376 LOC of views) and `placement_officer/` (498 LOC) are gone. Both were domain-shaped
all along — `staff` ran placement drives, `placement_officer` reported on them — they were just
named after the people who used them. They are now one app named after the domain.

```
placements/
    models.py       Notice · CompanyRegistration · JobOffer · CategoryRule
    services.py     eligibility · categorisation · every report      (541 LOC)
    serializers.py  unchanged field lists — they are the API contract
    views.py        HTTP adapters only                                (524 LOC)
    urls_drives.py  mounted at /api/staff/            — paths unchanged
    urls_reports.py mounted at /api/placement_officer/ — paths unchanged
```

### The models moved without a single row moving

The rows are live: four batches of students, their offers, their salaries. So the move is
**state-only**. `placements/migrations/0001_initial.py` and the three migrations that pair with it
use `SeparateDatabaseAndState` with an empty `database_operations`, and every model pins
`Meta.db_table` to the name it already has:

| Model | `db_table` |
|---|---|
| `Notice` | `staff_notice` |
| `CompanyRegistration` | `staff_companyregistration` |
| `JobOffer` | `staff_joboffer` |
| `CategoryRule` | `placement_officer_categoryrule` |

Table names now carry an app label that no longer exists. That is ugly and it is deliberate:
renaming a live table is a deploy-ordering hazard — the old code is still serving requests while
the rename lands — and it buys nothing but tidiness. Do it later, with the stack down, as its own
migration. `tests/test_placements_port.py::test_models_moved_without_moving_their_tables` fails if
somebody "tidies" those `db_table` values away, because Django would then generate a migration
that renames four live tables.

`staff/` and `placement_officer/` still exist as **migration-only shells** — empty `models.py`, no
views, no URLs. They cannot be deleted outright: their migrations are recorded in
`django_migrations` on every live database, and removing the packages would break `migrate` there.
They go for real when the migration history is squashed.

### How the move was verified

The part that matters is not that the tests pass on a fresh database — it is that the **upgrade
path** works on a database that already has the old shape and real rows in it.

```
migrate against dev MySQL, populated, at the pre-move state:
    Applying placements.0001_initial................. OK
    Applying placement_officer.0002_move_models...... OK
    Applying student.0018_repoint_placement_fks...... OK
    Applying staff.0002_move_models_to_placements.... OK

after:  staff_notice 165 rows · staff_companyregistration 165 rows   (unchanged)
        CompanyRegistration.objects.count() == 165   (read through placements)
        StudentOffer.company -> placements.CompanyRegistration
        no DDL executed
```

Plus `makemigrations --check` clean (the state migrations match the models exactly), 921 tests on
**both** engines, and the frontend building against regenerated types.

### Two dead features, revived

A port must not change behaviour. These two are exceptions, made deliberately because the
alternative was knowingly re-shipping code that could not work. Both are covered by
`tests/test_placements_port.py`.

**1. "Notify eligible students" had been returning 400 to every click.**

```python
Notification.objects.create(..., type_notification="placement")
```

`type_notification` was **removed from the model** in
`notifications/migrations/0006_remove_notification_type_notification_and_more`. Passing it raises
`TypeError`, which the view's blanket `except Exception` turned into a generic 400. So the core
"tell eligible students about this drive" workflow has been silently dead since that migration —
the button works, the error is generic, and nothing in the logs says the field does not exist.
Fixed by passing `category=`, the field that replaced it.

**2. Three category-rule pages had no URL behind them.**

`CategoryRuleForm.tsx`, `CategoryRuleList.tsx` and `StudentByCategory.tsx` have always called
`/api/placement_officer/category-rules/create/`, `.../list/` and `.../students/by-category/…`. The
view functions existed in `placement_officer/views.py`. No URL ever pointed at them, so all three
pages 404'd. Routed now, and added to `docs/PERMISSIONS.md` — **check the `principal` column
there**, since creating a category rule changes which students a company may see.

### Side-effect worth noting

Schema warnings fell from **69 to 16** (T-22), because the ported views sit behind serializers that
`drf-spectacular` can introspect. The generated TS client is correspondingly better typed. That is
the argument for T-20/T-21 in one number.

### What T-19 did *not* finish

`placements/views.py` is 524 LOC, against T-21's target of ~150. The business logic is out — it is
in `services.py` — but the view module still holds all 25 endpoints in one file. Splitting it
(drives / applicants / exports / reports) is T-21's remaining work, and it is now a mechanical
change with 921 tests behind it.

---

## Why the rest stopped here

T-19, T-20 and T-21 are strangler-fig ports: write `placements/` and `students/` clean, move the
logic across from five role apps, repoint the URLs, delete the originals. Roughly 2,500 lines of
view code.

I stopped rather than start them, for one reason: **the characterisation tests do not cover that
code.** T-09 pinned eligibility and categorisation — the two pieces of domain logic the audit
called out. It did not pin `ConsolidationReportAPIView`, `BranchwiseReportAPIView`,
`PlacementDashboardAPIView`, `DepartmentDashboardSummaryView` or the training aggregations. Those
are ~1,500 lines of report-building with no test coverage at all.

Porting them would mean rewriting untested aggregation logic and having nothing that could tell me
whether the numbers still came out the same. The permission matrix proves *who can reach* an
endpoint; it asserts nothing about *what it returns*. A port that passes 856 tests and quietly
changes a placement percentage is the confident, plausible, subtly wrong diff this plan exists to
prevent — and it would be discovered by a coordinator, in a report, some weeks later.

T-22 was independent of that blocker, so it was done — see above. It also *helps* the ports: with
the schema committed and CI-guarded, a port that changes a response shape fails the build instead
of shipping.

### The blocker is now cleared

`tests/test_characterisation_reports.py` (16 tests) and `tests/report_fixture.py` pin the report
endpoints against a 6-student, 2-batch, 3-offer fixture small enough to verify by inspection.

Every expectation was **worked out by hand from the fixture and then compared against the code**,
not pasted from a run — a characterisation test whose expectations came from the code's own output
only proves the code still does what it did. All 16 passed on the first execution, which means the
hand-computed answers and the code agreed everywhere except the four places marked ⚠️ below, which
are pinned as-is.

Covered: `dashboard`, `branch_wise_report`, `get_data_by_year`, `consent`, `get_category_data`,
`unique-departments`, `department_coordinator/dashboard-summary`.

**T-19/T-20/T-21 are now safe to attempt.**

---

## Four more findings, from writing those tests

None of these were in the audit. They surfaced because computing the expected numbers by hand
forced someone to state what each report is supposed to mean.

### 1. ⚠️ "Placed" means two different things

`PlacementDashboardAPIView` counts a student as placed if **any** `StudentOffer` row exists,
whatever its status. `DepartmentDashboardSummaryView` counts only
`status__in=["accepted", "joined"]`.

On the fixture, over identical data, the placement officer's dashboard reports **3 placed** and the
department dashboard reports **2**. A student who has merely *received* an offer is placed on one
screen and not on the other.

Both definitions are defensible. Having both, unlabelled, in one system is not — and the number
that gets quoted upward is the larger one.

### 2. ⚠️ The consolidation report classifies every offer as "Normal"

```python
salary = int(item.get("salary") or 0)
if salary < 500000:    emp_type = "Normal"
elif salary < 1000000: emp_type = "Dream"
else:                  emp_type = "Super Dream"
```

The thresholds are in **rupees**. `JobOffer.salary` holds **LPA** — the same field the dashboard
reads as LPA to build its salary bands, two endpoints apart. So an 8 LPA offer and a 12 LPA offer
are both "Normal", and no offer can ever be anything else short of somebody entering a salary of
500,000 LPA.

This is Phase 1 characterisation finding #4 — salary has no unit anywhere — now demonstrably
producing a wrong column in a report that goes to the placement officer. **T-25.**

### 3. ⚠️ `/api/placement_officer/consent/<year>/` ignores the year

The view takes a `year`, computes `batch_year_suffix` from it, and then never uses either. Every
query is `Student.objects.all()`. The report is college-wide and all-time whichever year you ask
for — and asking for 2024 and 2025 returns byte-identical output.

Visible in the fixture: IT-A shows 3 students where batch 2025 has 2.

### 4. The consent payload is double-encoded

`json.dumps` applied to data that is then handed to `JsonResponse`, so the response is JSON
containing JSON *strings*. Callers parse twice. Harmless but load-bearing: a port that returns real
objects breaks the frontend silently. Pinned so it cannot happen by accident.

---

## Behaviour changes in this phase

Phase 2 is supposed to change structure, not behaviour. These are the exceptions:

| Change | Why |
|---|---|
| `get_is_read` no longer issues a query per notification | Bug fix. Same output, 45 fewer queries per page. |
| Notification recipients resolved at read time | The task. Equivalence-tested against the old rules. |
| Python module `t_and_p_automation` → `config` | T-16. **Deploy note: the Compose *project* name is unchanged**, so container names and your `docker exec` commands still work. |

Nothing else in this phase touches a code path a user can reach.

---

## Before you continue

**Still blocking, still yours, unchanged since Phase 1:**

1. **T-01 / T-02 / T-03** — the repository is still public and student data is still in its
   history.
2. **Approve [`docs/PERMISSIONS.md`](PERMISSIONS.md)** — 716 tests enforce it.
3. **T-12** — strip `is_staff` from the 16 non-admin accounts.

**New, from this phase:**

4. **Run `seed_institution --dry-run` against real data** and decide the duplicate merges. T-24
   cannot start until that is settled.
5. **Decide whether to run the attendance backfill at all.** It is ready; nothing forces the
   cutover. The old models still work.
6. ~~Characterisation tests for the report endpoints~~ — ✅ done, T-19/T-20/T-21 are unblocked.

**Worth deciding, not blocking — three live bugs, none of them cosmetic:**

| | Bug | Scheduled |
|---|---|---|
| a | `categorize()` writes `Category_1` into a field whose eligibility check reads `Category 1`. A categorised student matches no branch and is **refused every placement drive**. | T-29 |
| b | Two definitions of "placed" — the placement officer's dashboard counts unaccepted offers, the department dashboard does not. The two screens disagree by design, silently. | unscheduled |
| c | The consolidation report's `employee_type` compares LPA against rupee thresholds, so **every offer reads "Normal"**. | T-25 |

(a) and (c) are both downstream of the same root cause: numbers stored as strings with no unit and
no type. That is exactly what Phase 3 opens with.
