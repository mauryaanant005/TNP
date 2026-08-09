# TNP Portal — Agent Operating Prompt

**Load this before touching the repository.** It is the standing brief for any AI coding agent
working on this codebase. It exists because the architecture audit found that *three competing
authorisation mechanisms and five overlapping attendance models* happened exactly by each new
session re-deriving conventions from scratch.

Companions:
- [`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md) — what is wrong and why
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — what to do, in what order
- [`PERMISSIONS.md`](PERMISSIONS.md) — the authorisation spec (also the test fixture)
- `PHASE_<n>_IMPLEMENTATION.md` — what each phase actually did, once executed

---

## 1. Role

You are executing a **staged remediation of a live system**. Around 1,400 real students, four
batches of placement records and salary data depend on it. It is deployed and in use.

You are not rewriting it. You are not "cleaning it up". You execute one task from
`IMPLEMENTATION_PLAN.md` at a time, verify it, and stop.

---

## 2. The ten rules

1. **Tests land before refactors.** Phase 1 blocks Phases 2–4. Without a test, a refactor is a
   guess — and an agent's guess reads like working code on review.
2. **Never confirm your own data migration.** Write the migration *and* a verification script,
   then stop and hand it to a human. This is absolute for T-18 and T-24.
3. **Never widen a permission to make a test pass.** If a test fails on authorisation, either the
   test encodes the spec and the code is wrong, or `PERMISSIONS.md` is wrong and must be changed
   *deliberately, in its own commit*. Silently adding a role to a tuple is the failure mode this
   whole plan exists to prevent.
4. **Never commit student data.** No `*.xls`, `*.xlsx`, `*.csv`, no `local_data/`, no
   dumps in fixtures, no real UIDs or emails in tests. Factories generate synthetic data.
5. **A model change without a migration is an incomplete change.** `makemigrations --check
   --dry-run` runs in CI; run it before you claim done.
6. **One task per session.** These tasks are sized deliberately. "Do Phase 3" produces an
   unreviewable diff.
7. **Roles are data, never module boundaries.** Never create an app named after a job title. If a
   new role needs endpoints, they belong in the domain app that owns the data.
8. **Business logic goes in `services.py`, not `views.py`.** Views are thin HTTP adapters. Target:
   no `views.py` over ~150 LOC.
9. **Assume production is MySQL.** SQLite differs in constraint enforcement, collation and casing.
   Verify schema work against MySQL (`docker-compose.dev.yml`), never against SQLite alone.
10. **Watch query counts.** Idiomatic ORM code that issues one query per row is invisible at 1,400
    students and a timeout at 10,000. List endpoints get `assertNumQueries`.

---

## 3. Conventions

### Authorisation — exactly one mechanism

```python
from base.permissions import HasRole, DepartmentScoped

class CompanyListCreateView(generics.CreateAPIView):
    permission_classes = [HasRole.of("staff", "placement_officer")]
```

Banned, without exception:
- `IsAdminUser` — it checks `is_staff`, which `create_user` never sets. It rejects real staff
  accounts and accepts faculty. This is audit finding #3.
- `if request.user.role != "x": return Response(..., 403)` inside a view body.
- A new `BasePermission` subclass per role.

`is_staff` means **"may open Django admin"** and nothing else. Never read it for API authorisation.

### Schema

| Concern | Rule |
|---|---|
| Money | `DecimalField(max_digits=12, decimal_places=2)`. Never `Float`, never `Char`. |
| Marks / CGPA | `DecimalField`. Eligibility must be filterable in SQL. |
| Dates | `DateField` / `DateTimeField`. Never `TextField`. |
| Foreign keys | Real FKs. `on_delete=PROTECT` for records with legal weight; never `DO_NOTHING`. |
| Reference data | FK into `institution/`. Never a free-text department or batch string. |
| Audit | `created_at`, `updated_at`, `updated_by` on anything a human edits. |
| Indexes | Any column you filter or join on. Declare them in the same migration as the table. |

### Apps

Domain, not role. Target layout is `ARCHITECTURE_AUDIT.md` §2.3. Each app owns its `models.py`,
`services.py`, `serializers.py`, `views.py`, `urls.py`, `tests/`.

### Migrations

One migration per task. Data migrations **report** anomalies (unmapped values, orphan rows) and
never silently drop or null a row. A data migration that loses data quietly is worse than one that
refuses to run.

---

## 4. Method — strangler fig

For any task that says "port" or "restructure": **do not incrementally edit the old app.**

1. Write the new domain app clean — models, services, tests.
2. Port the behaviour across. The old code is the specification.
3. Repoint the URLs. Paths stay identical; the frontend must not notice.
4. Delete the old app once it is empty.

Characterisation tests (T-09) are what prove old and new agree. If they do not exist yet for the
code you are porting, write them first.

---

## 5. Verification

Before claiming a task done:

```bash
docker exec t_and_p_automation-api-1 pytest -q
docker exec t_and_p_automation-api-1 python manage.py makemigrations --check --dry-run
```

Then state, in plain language:
- what you changed,
- what you ran,
- what the output actually was,
- what you did **not** verify.

If tests fail, say so and paste the output. Never report a task green on the strength of "the code
looks right". A migration you have not run is not a migration that works.

---

## 6. Review levels

| | Meaning | Your behaviour |
|---|---|---|
| 🟢 | Agent completes and self-verifies | Do it, run the checks, report. |
| 🟡 | Human reads the diff before merge | Do it, then explicitly flag what needs human judgement. |
| 🔴 | Human runs and verifies | **Prepare only.** Write the migration and the verification script, then stop. Do not apply it. |

Tasks currently at 🔴: T-01, T-02, T-03 (breach containment — not delegable), T-18 (attendance
migration), T-24, T-26 (FK migrations).

---

## 7. Stop conditions

Stop and ask a human when:

- A task requires deciding policy (which category spelling is canonical, who keeps admin access,
  whether guardians may receive student data).
- A migration reports unmapped values or orphan rows.
- A test fails and the only fix you can see is loosening the test.
- The task as written contradicts something you found in the code — say so rather than picking one.
- You are about to touch real user accounts, git history, or production data.

Saying "this is ambiguous, here are the two readings" is a correct answer. Guessing is not.
