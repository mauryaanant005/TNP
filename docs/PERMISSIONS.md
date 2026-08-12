# TNP Portal — Permission Matrix

**Status:** 🟡 *needs your approval.* This is the **specification**, not a description of current
behaviour. Today's behaviour is wrong in both directions (audit §4.1) — a `staff` user is locked
out of `/api/staff/*` while a `faculty` user is let in. Where this document and the code disagree,
**this document wins** and the code is the bug.

**It is also the test fixture.** `tests/permission_matrix.py` is the machine-readable form of the
tables below and `tests/test_permission_matrix.py` asserts every cell. Changing a rule means
changing both, in a commit that says why.

---

## Roles

| Role | Who they are |
|---|---|
| `anonymous` | Not logged in |
| `student` | ~1,400 students. Self-service only. |
| `faculty` | Teaching staff who mark training attendance for an assigned program |
| `program_coordinator` | Owns a training program end to end |
| `department_coordinator` | Owns one department's students |
| `training_officer` | College-wide training oversight |
| `placement_officer` | College-wide placement reporting |
| `internship_officer` | Internship verification and reporting |
| `staff` | T&P office — runs placement drives |
| `principal` | Read-only college-wide oversight |
| `system_admin` | Superuser |

`system_admin` (and any `is_superuser` account) passes every check. It is omitted from the tables
below for that reason.

### `is_staff` means exactly one thing

**"May open the Django admin."** It is not a role, not a seniority marker, and it must never be
read by an API permission check. `CustomUserManager.create_user` does not set it; only
`create_superuser` does. Every API rule below keys off `User.role`.

---

## Reading the tables

`✅` allowed · `❌` denied (`403`, or `401` when anonymous)

An `✅` asserts only that **authorisation passed** — the endpoint may still answer `400`, `404` or
`405` on the request body. The test asserts `status not in (401, 403)`; it deliberately does not
pin the success status, because that would couple an authorisation test to unrelated validation
behaviour.

---

## Authentication and shared endpoints

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/health/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/` (whoami) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/logout/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /admin/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

`/admin/` is superuser-only. Django gates it on `is_staff`, so this row is enforced by **data**
(T-12 strips the flag from the 16 non-admin accounts that currently hold it), not by code.

---

## Notifications — `/api/notifications/`

Everyone authenticated reads their own notifications. Creation is role-gated, and *which
audiences* a role may target is a second, finer rule already implemented in
`ROLE_AUDIENCE_PERMISSIONS` in `notifications/views.py`.

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/notifications/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/notifications/unread-count/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/notifications/` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Student self-service — `/api/student/`

Every one of these scopes to `Student.objects.get(user=request.user)`. No other role has a reason
to call them; a coordinator reading a student's record does it through the department or
placement endpoints, which apply department scoping.

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/student/info/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET,POST,PUT /api/student/resume/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/student/attendance-data/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/student/training-performance/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/student/placement-card/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/student/internships/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/student/company/register` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /api/student/delete-account/` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Placement drives — `/api/staff/`

This is the module the audit found broken: it gates on `IsAdminUser`, so **the `staff` role is
denied its own module** and any `is_staff` account (including the 10 faculty) is admitted.

Company *reads* stay open to all authenticated users — students must see eligibility criteria
before deciding whether to apply, and that is the intended flow.

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/staff/placement/company/<id>/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/staff/placement/companies/batch/<b>/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/staff/companies/batches/` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/staff/placement/company/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `PATCH,DELETE /api/staff/placement/company/<id>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `POST /api/staff/placement/company/send_notifications/<id>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/company/<id>/interested-students/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/company/<id>/not-interested-students/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/company/<id>/eligible-not-registered/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `POST /api/staff/company/bulk-update-progress/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/company/<id>/trigger-excel-export/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/company/<id>/trigger-resume-export/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/task-status/<tid>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET,PATCH /api/staff/update/student/<uid>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `POST /api/staff/category_update/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `POST /api/staff/historical-import/upload/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/staff/historical-import/status/<tid>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |

> ⚠️ **`category_update` rewrites `current_category` for a whole batch in one POST.** It is listed
> as `staff` + `placement_officer` because that is who runs it today. If you want it narrowed to
> `placement_officer` alone, say so — it is the single most destructive endpoint in the table.

---

## Placement reporting — `/api/placement_officer/`

Read-only aggregates. `principal` is included because the principal dashboard renders these exact
reports (`client_app/src/routes/PrincipalRoutes.tsx`).

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/placement_officer/consent/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/filter/<dept>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/unique-departments/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/get_category_data/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/get_category_data_by_department/<d>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/get_data_by_year/<b>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/dashboard/<b>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/branch_wise_report/<b>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/student_detail_report/<b>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `POST /api/placement_officer/category-rules/create/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/category-rules/list/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/placement_officer/students/by-category/<c>/<b>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

> **The last three rows are new in T-19.** The views existed in
> `placement_officer/views.py` and `CategoryRuleForm.tsx`, `CategoryRuleList.tsx` and
> `StudentByCategory.tsx` have always called them — but no URL ever pointed at them, so all three
> pages returned 404. They are routed now. **Confirm you want `principal` to be able to *create* a
> category rule** — category rules decide which students a company may see, so this is a write with
> real consequences. Narrowing it to `placement_officer` alone is a one-word change.

**Change from today:** the current `IsPlacementOfficerOrAdmin` also admits anyone with `is_staff`.
That clause goes — it is the same conflation as `/api/staff/`, one layer down.

---

## Training — `/api/program_coordinator/`, `/api/faculty_coordinator/`, `/api/training_officer/`

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/program_coordinator/training-performance/template/<t>/` | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/program_coordinator/training-performance/upload/<t>/` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/program_coordinator/attendance/<table>/` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/program_coordinator/save-branch-attendance/<t>/` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/program_coordinator/update-attendance/<t>/` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/program_coordinator/create-attendance-record/` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/program_coordinator/avg-data/<t>/` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /api/program_coordinator/student-analytics/` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /api/program_coordinator/aggregate-analytics/` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /api/faculty_coordinator/data` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/faculty_coordinator/attendance` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/faculty_coordinator/save-attendance` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/faculty_coordinator/reset-attendance` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/training_officer/get-avg-data/<t>/` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

**Change from today:** `/api/training_officer/get-avg-data/` currently has *no role check at all* —
any authenticated user, including a student, receives college-wide training aggregates by
branch/division/year (audit §4.3, finding #20). It becomes `training_officer` + `principal`.

`student-analytics` and `aggregate-analytics` additionally scope their queryset by the caller's
`FacultyResponsibility.department` and return an empty set when there is none. That scoping is
correct and stays; this table governs only who may reach the endpoint at all.

---

## Department — `/api/department_coordinator/`

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/department_coordinator/student-data/` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/department_coordinator/dashboard-summary/` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/department_coordinator/attendance/upload-attendance/` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/department_coordinator/attendance/upload-performance/` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/department_coordinator/upload-inhouse-internship/` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Change from today:** `upload-inhouse-internship` currently gates on *having a
`FacultyResponsibility` row with a department*, not on role — so any faculty member with a
department can bulk-create internship acceptance records. It becomes `department_coordinator`.

---

## Internships — `/api/internship/`

| Endpoint | anon | student | faculty | prog_coord | dept_coord | training | placement | internship | staff | principal |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/internship/company/<pk>` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/internship/company/register/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `GET /api/internship/company/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /api/internship/job_application/create/<pk>` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/internship/jobs/verify/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /api/internship/jobs/verify/selected/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `GET /api/internship/jobs/reports/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `GET /api/internship/jobs/download-report/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

**Change from today:** several of these answer `404 {"error": "Failed to find user"}` on an
authorisation failure. A `404` for "you are not allowed" is a lie to the client and unlogged as an
authz event. They become `403`.

---

## Open questions for you

These are the cells I could not derive from the code or the audit. I have picked the **narrower**
option in the matrix above; flag any you disagree with.

| # | Question | What I assumed |
|---|---|---|
| 1 | Should `principal` see placement and training reports, or only summary dashboards? | Full read on both reporting modules |
| 2 | Should `staff` retain internship verification, or does that belong to `internship_officer` alone? | Retained — it matches today's behaviour and `StaffRoutes.tsx` |
| 3 | Should `department_coordinator` reach `student-analytics`? | Yes, scoped to their own department |
| 4 | Is `program_coordinator` a superset of `faculty` for training endpoints? | Yes |
| 5 | Should `category_update` be `placement_officer` only? | No — kept `staff` too |

---

*Derived from the audit of commit `ceeeb43`. Machine-readable form:
[`tests/permission_matrix.py`](../tests/permission_matrix.py).*
