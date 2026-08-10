# Historical Batch Data Integration — Implementation Plan

**Companion to** [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) and
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md). Those cover the platform refactor; this one
covers a single question: **getting the 2026 and 2027 cohorts into the portal and visible on
every page that should show them.**

**Execution model:** AI coding agents, one task per session.
**Estimate:** ~4 days · **5 phases · 3 test gates.**

> ⚠️ **This plan handles live student PII.** The source spreadsheets name real students against
> real employers and real salaries. `IMPLEMENTATION_PLAN.md` T-01–T-04 (repo private, history
> purged) are **prerequisites**, not parallel work.

---

## The five phases

| # | Phase | Tasks | You test | Status |
|---|---|---|---|---|
| **H1** | **Establish ground truth** — what is actually in the files and the DB | H-01 … H-03 | — | ✅ done |
| **H2** | **Repair** — undo the previous broken import | H-04 … H-06 | [gate 1 →](#-test-gate-1--after-repair) | 🟨 built · dry-run clean · **not committed** |
| **H3** | **Import** — rosters and placement registers | H-07 … H-10 | [gate 2 →](#-test-gate-2--after-import) | 🟨 built · dry-run clean · **not committed** |
| **H4** | **Make it visible** — batch filters, dropdowns, charts | H-11 … H-15 | [gate 3 →](#-test-gate-3--end-to-end-audit) | ✅ done |
| **H5** | **Synthetic activity data** — training / internships | H-16 … H-17 | gate 3 | ✅ done |

`⬜ not started` · `🟨 in progress` · `✅ done` · `⛔ blocked`

### Review levels
| | Meaning |
|---|---|
| 🟢 | Agent completes and self-verifies. |
| 🟡 | Agent completes; you read the diff. Touches real records or business rules. |
| 🔴 | Agent may *prepare* it; **you** run and verify. Destructive or irreversible. |

### Two rules that outrank every task
1. **A row is never dropped silently.** Every rejected row is counted and printed with its Excel
   row number. The previous import had no such rule, and that is the entire reason this plan
   exists.
2. **An agent never confirms its own data import.** It writes the importer and the verification
   query, then stops. You run it against a copy and read the numbers.

---

# Phase H1 — Establish ground truth ✅

### H-01 · Profile the source files 🟢 ✅
**Finding — the file list in the original request was wrong.** Three files were named; the
decisive one was not among them.

| File | What it actually is | Rows | Usable content |
|---|---|---|---|
| `2028 Batch.xlsx` | Student **roster**, 18 columns | 1416 | already imported |
| `Batch_2027_Extracted_Output.xlsx` | Student **roster for 2027**, identical 18 columns | 1105 | **not imported** — only 121 of these students exist in the DB |
| `…Register Batch-2027 07072026.xls` | Placement **register** (one row per *offer*) | 125 valid / 122 students | placements only |
| `…Register Batch-2026 30052026.xls` | Placement **register** | 584 valid / 507 students | placements only |

Two further registers (`…Batch-2024`, `…Batch-2025`) exist in the directory and are out of scope.

**Consequences you cannot design around:**
- **There is no student roster for batch 2026.** That cohort can only ever contain the 507
  students who received an offer. Its placement rate will read 100% because the denominator is
  missing, not because every student was placed.
- **The registers are dirty.** Below and right of the data block sit signature lines, per-branch
  count pivots and salary summaries. pandas reads them as rows — `Type of Placement` contains
  `'E&CS'` and `'6.25'`; the visit-date column contains `'(Rupali Mane)'` and
  `'Dy.(Placement Officer)'`. The only reliable row gate is the UID pattern.
- **No attendance, training or internship data exists in any file** — see [H5](#phase-h5--synthetic-activity-data).

**Status:** ✅ done

### H-02 · Profile the live database 🟢 ✅
A previous run of the root script `import_placements.py` left this behind:

| Damage | Detail |
|---|---|
| 37 fabricated students | UIDs `'3.46'`, `'AI&ML'`, `'10.2'`, `'26'`, `'8'` … each with a **working login** |
| 636 students on fake logins | `<uid>@student.tcet.ac.in` — wrong domain; real 2027 addresses (`1032230036@tcetmumbai.in`) sit unused in the roster |
| 655 students with `department=''` | every 2026 and 2027 row |
| 157 companies mis-batched | tagged `batch='2028'` while holding all 584 **batch-2026** offers (`import_placements.py:158` passes `'2028'` for the 2026 file) |
| 12 students in batches 2029–2033 | `Student.save()` derives batch from the UID's last two digits |
| every offer `role='Software Engineer'` | hardcoded; with `unique_together (student, company, role)` this **collapses** a student's multiple offers from one employer |
| 284 PLI offers mistyped | `offer_type` never mapped `PLI`; distribution is `PLACEMENT` 670 / `AEDP_OJT` 82 |

**Status:** ✅ done

### H-03 · Confirm the schema constraints that shape the importer 🟢 ✅
- **`uid` is the only identifier.** No PRN, roll-number or enrolment column exists anywhere.
  Every upsert keys on it.
- **`Student.save()` overwrites `batch`** from the UID suffix (`student/models.py:55-61`). The
  importer does not fight this — a row's UID is the authority on its cohort.
- **`CustomUserManager._create_user` sends an email per account** (`base/models.py:20`). Importing
  1105 students through the manager sends 1105 emails and exhausts the ~500/day Gmail cap, after
  which **OTP login silently stops working**. Users must be constructed directly.
- **`StudentOffer.salary` is a non-null `FloatField` with no default**; `CompanyRegistration.notice`
  is a non-null `OneToOne`. Neither can be skipped.
- `base/models.py:75` called `os.getenv` without importing `os` — any save of a passwordless user
  raised `NameError`. Fixed.

**Status:** ✅ done

---

# Phase H2 — Repair

**Goal:** the database contains no fabricated rows and no mis-filed ones before a single new row
lands. Running the import over the existing mess would compound it.

**Delivered as** `python manage.py import_historical_data --repair`, implemented in
`dataimport/repair.py` as four independent passes so each one's blast radius is separately visible
in the report.

### H-04 · Purge fabricated students 🔴
Pass 1. Any `Student` whose `uid` fails `^\d{2}-[A-Za-z&]+\d+-\d{2}$` is a spreadsheet footer cell,
not a person. Deletes the student, its offers, and its login.
**Expected:** 37 students, 37 accounts.
**Status:** 🟨 built — `repair.purge_fabricated_students`

### H-05 · Purge register orphans, report the misfiled 🔴
Pass 2 deletes rows whose UID *looks* real but which appear in **no source file**, have **no
department**, and hold a **synthesised login** — all three, or the row is kept. These are the four
bad-suffix lines in the 2026 register (`23-CS&E70-31` and friends).

Pass 3 **reports and does not touch** the ten students in batches 2029–2033 that carry real
`@tcetmumbai.in` addresses and real departments. Their UID suffixes are wrong *at source*.
Correcting a UID is a decision about a real person's record, not an import concern.

> This distinction is the whole reason H-04 and H-05 are separate passes. A single "delete
> anything odd" rule would take ten real students with it.

**Status:** 🟨 built — `repair.purge_register_orphans`, `repair.report_misfiled_students`

### H-06 · Re-batch the companies 🟡
Pass 4. For every offer where `company.batch != student.batch`, move the offer onto a company
carrying the student's batch, creating it (with its mandatory `Notice`) if absent. Where the
correctly-batched offer already exists, the leftover is deleted rather than violating
`unique_together`. Companies left holding no offers, applications or roles are pruned.

**Expected:** 584 offers moved from batch-2028 companies to batch-2026 ones; ~157 companies
re-batched or pruned.
**Status:** 🟨 built — `repair.rebatch_companies`

---

## ✅ Test gate 1 — after repair

**Back up first.** This phase deletes rows.
```bash
docker exec t_and_p_automation-api-1 python manage.py dumpdata > backup_pre_import.json
```

Run it in dry-run first and **read the report before committing**:
```bash
docker exec t_and_p_automation-api-1 python manage.py import_historical_data --repair --dry-run
```

| Check | Expected |
|---|---|
| Students with a non-UID `uid` | **0** |
| Batch dropdown | no 2029–2033 |
| The ten `25-*` students with real emails | **still present**, reported not deleted |
| `CompanyRegistration` batches | 2026 / 2027 / 2028 only, counts plausible |
| Offers whose `company.batch != student.batch` | **0** |

---

# Phase H3 — Import

**Delivered as** the `dataimport/` app — management commands, not root scripts, so the work is
repeatable, testable and does not live next to `delete_students.py`.

```
dataimport/
  normalize.py   value coercion — UID gate, departments, consent, dates, money
  sources.py     file discovery by *content*, sheet + header-row detection
  students.py    Student + User upsert; the email-suppression and relink rules
  roster.py      the 18-column roster
  register.py    the placement registers
  repair.py      phase H2
  report.py      the import report
  management/commands/import_historical_data.py
```

### H-07 · Value normalisation 🟢
`dataimport/normalize.py`. The rules that matter:

| Concern | Rule |
|---|---|
| **UID gate** | `^\d{2}-[A-Za-z&]+\d+-\d{2}$`. The single most important line in the import. |
| **Departments** | Database spelling wins — the API filters with exact `filter(department=...)`, so `IOT` vs `IoT` is a silently empty report. Folds `IOT→IoT`, `M&ME→MME`, `Mech→MECH`. |
| **Divisions** | 2027 has undivided `AI&ML` where 2028 has `AI&ML-A/B/C`. That is a real cohort difference and is **preserved**, not normalised away. |
| **Consent** | `'Placement'→'placement'`, `'Higher Studies'→'Higher studies'`, `'Entrepreneurship '` (trailing space) `→'Entrepreneurship'`. |
| **Dates** | `Date of Joining` mixes real dates with `'After graduation'`. Prose returns `None` rather than a wrong date. |
| **Contact** | Excel stores phones as floats: `9694365247.0 → '9694365247'`. |
| **Salary** | Stored as **LPA**, matching the register and the dashboard's `0-5 / 5-7 / …` bands. |

**Status:** 🟨 built

### H-08 · Roster import 🟢
`dataimport/roster.py`. Idempotent upsert keyed on `uid`. The `password` column (every row says
`tcet@1234`) is **ignored** — passwords come from `DEFAULT_SEED_PASSWORD` and are hashed on the
way in.

**Login relink:** where a student currently holds a synthesised `@student.tcet.ac.in` address and
the roster supplies the real `@tcetmumbai.in` one, the account is **upgraded in place** — same id,
same password, nothing orphaned. Expected: 121 relinks, 984 new students for 2027.

**Performance note:** the seed password is hashed **once** and reused. PBKDF2 at Django 5's default
iteration count costs ~100 ms, so per-row hashing turned a 1105-row roster into two minutes of pure
key derivation.

**Status:** 🟨 built

### H-09 · Placement register import 🟡
`dataimport/register.py`. Header detected at row 5 of the date-named sheet; every row gated on the
UID pattern; **batch read from each row's own UID suffix, never from the filename** — the argument
that the old script got wrong.

**`role` carries the placement scheme** (`Regular` / `PLI` / `AEDP`), not a job title. The registers
have no job-title column, and `unique_together (student, company, role)` means a constant role
collapses a student's multiple offers from one employer. This is the most informative discriminator
actually present. Consequence: the dashboard's "top job roles" chart reads schemes — honest, given
the source.

**Deliberately not imported** (no column exists on any model; recorded in the report instead of
being smuggled into an unrelated field): `Stipend Offered` (189 values), `Campus On/OFF`,
`No. of Offers`, `Dual Offer`.

**Status:** 🟨 built

### H-10 · `offer_date` — the one sanctioned schema change 🟡
`student/models.py` · `student/migrations/0019_alter_studentoffer_offer_date.py`
```diff
- offer_date = models.DateField(auto_now_add=True)
+ offer_date = models.DateField(default=timezone.now)
```
`auto_now_add` is unconditional and unsettable, so every back-imported offer was stamped with its
*import* date and the dashboard's placements-over-time chart (a `TruncMonth` over this column)
collapsed four years of drives into a single bar. Additive, non-destructive; new offers still
default to today.

**Status:** ✅ done — migration applied

---

## ✅ Test gate 2 — after import

```bash
docker exec t_and_p_automation-api-1 python manage.py import_historical_data --dry-run
docker exec t_and_p_automation-api-1 python manage.py import_historical_data --repair
```

The report must reconcile. **These are measured from an actual dry run, not estimates:**

| Line | Expected | Why |
|---|---|---|
| Files processed | 3 | 2027 roster, 2026 register, 2027 register |
| Total rows read | 3153 | |
| Students created | **981** | new 2027 roster students |
| Students updated | **633** | 507 batch-2026 + 122 batch-2027 rows getting the department they never had, + 4 bad-suffix |
| Already current | 202 | |
| Login accounts created | 981 | |
| Login accounts corrected | **122** | placeholder `@student.tcet.ac.in` upgraded to the real `@tcetmumbai.in` |
| Companies created | 146 | distinct 2026 employers; the 6 for 2027 already exist |
| Offers created | **713** | 584 (2026) + 125 (2027) + 4 bad-suffix rows |
| Duplicate rows | 0 | multi-offer students survive because `role` carries the scheme |
| Invalid rows skipped | **53** | 51 footer/pivot cells + 2 malformed roster emails |

**Rejected rows to expect** — these are real defects in the source, not importer bugs:
- `Batch_2027_Extracted_Output.xlsx` row 11 — email `10322310001tcetmumbai.in` is **missing its `@`**
- `Batch_2027_Extracted_Output.xlsx` row 981 — no email at all
- 51 register rows carrying pivot values (`'AI&ML'`, `'9.82'`, `'4.25'`) where a UID should be

**Anomalies to expect:** 4 bad-suffix UIDs in the 2026 register (`23-CS&E67-28`, `-31`, `-27`, `-29`);
5 offers with no salary (incl. one reading `'As Per Industry Standard'`); 190 stipend values and
704 campus flags with nowhere to go; batch 2026 flagged "only placed students".

> **Do not read a low `invalid rows` count as success.** Wholly-blank spreadsheet rows are skipped
> without being counted; the 53 are rows with *content* that failed the gate. If this number drops
> toward zero, the UID gate has stopped working and footer cells are becoming students again.

Then, in SQL:
```sql
SELECT batch, COUNT(*) FROM student_student GROUP BY batch;     -- 2026:507  2027:1105  2028:1416
SELECT batch, COUNT(*) FROM staff_companyregistration GROUP BY batch;
SELECT DATE_FORMAT(offer_date,'%Y-%m') m, COUNT(*) FROM student_studentoffer
  JOIN student_student s ON s.id = student_id WHERE s.batch='2026' GROUP BY m ORDER BY m;
```
The last query must show a **spread across 2025-06 … 2026-06**, not one row.

---

# Phase H4 — Make it visible

Importing rows is not the deliverable; the pages showing them is. These are the specific things
that will still be empty after a perfect import.

### H-11 · The batch dropdown 🟢
**The React batch selector's only source is `CompanyRegistration.batch`** —
`staff/views.py:67 CompanyBatchesView` → `client_app/src/pages/placement_officer/hooks.ts:10
useBatchOptions()`. Student rows are invisible to it. It returns values **unsorted**, and
`useBatchOptions` auto-selects `data[0]`, so which cohort the officer sees first is currently an
accident of insertion order.

**Do:** sort descending in `CompanyBatchesView`, filter blanks. After H3 the values are correct.
**Accept:** the dropdown reads 2028 / 2027 / 2026, defaulting to 2028.
**Status:** ✅ done

### H-12 · Batch-blind endpoints 🟡
These merge every cohort into one number the moment historical data lands. Each needs a `?batch=`
filter:

| Endpoint | File |
|---|---|
| `statistic`, `filter_by_department`, `get_category`, `get_category_by_department` | `placement_officer/views.py:46, 71, 109, 128` |
| `get_avg_data` | `training_officer/views.py:17` |
| `get_attendance_data` (raw SQL, **no WHERE at all**), `get_avg_data` | `program_coordinator_api/views.py:293, 426` |
| `DepartmentStudentDataView` (only `?uid=`) | `department_coordinator/views.py:80` |
| verified-internship list + **`download-report` (exports every internship ever)** | `internship_api/views.py:265, 292, 316` |

Also: `get_category` (`placement_officer/views.py:114`) and `staff/utils.py:81` hardcode
`academic_year="BE"`. Graduated 2026/2027 students are excluded from eligibility by that alone.
**Status:** ✅ done

### H-13 · Remove the dummy fallbacks 🟡
Several pages render invented data when the API returns empty, which makes an empty cohort
indistinguishable from a populated one — the exact failure this work is meant to end:
`training_officer/TrainingStats.tsx:45` (`DUMMY_ANALYTICS`, years 2027/2028),
`department_coordinator/DepartmentStats.tsx:50,59,87`,
`program_coordinator/Attendance.tsx:89-123`, `placement_officer/fallbackData.ts`.
Replace with an honest "no data for this batch" state.
**Status:** ✅ done

### H-14 · Frontend batch inputs 🟢
`program_coordinator/components/GlobalFilters.tsx:51` is a **free-text** batch box whose
placeholder reads `"e.g., A"` (it is a year). `placement_officer/Old.tsx:37,80,323` hardcodes
`<option>` 2022–2025. Point both at `useBatchOptions()`.
**Status:** ✅ done

### H-15 · Surface the 2026 caveat 🟡
Batch 2026 contains only placed students, so its placement rate is 100% by construction. The
importer flags this; the UI must not present it as a result. Add a note on the dashboard and
consolidated report when the cohort has no unplaced members.
**Status:** ✅ done

> **Known, not fixed:** `StudentOffer.salary` is read as **LPA** by the dashboard
> (`placement_officer/views.py:306`) and as **rupees** by the consolidation report's
> `employee_type` (`:280-289`), which therefore labels every offer "Normal". Pre-existing,
> pinned in `tests/test_characterisation_reports.py`, owned by T-25. Not touched here.

---

# Phase H5 — Synthetic activity data

**Every training, attendance, internship and notification table is empty — for all batches,
including 2028.** No source file contains any of it. Per your decision, these are seeded
synthetically so the dashboards render.

### H-16 · Synthetic seeder 🔴
`python manage.py seed_synthetic_activity --batches 2026 2027 2028`

Writes the models the views actually read: `AttendanceData` (student dashboard + both
`get_avg_data` endpoints), `TrainingPerformance` + `TrainingPerformanceCategory`, and
`InternshipAcceptance`.

**Every row must be tagged and reversible:**

| Model | Marker |
|---|---|
| `AttendanceData` | `session` prefixed `SYNTH-` |
| `TrainingPerformance` | `training_type` suffixed `(synthetic)` |
| `InternshipAcceptance` | `company_name` prefixed `[SYNTHETIC]`, `domain_name='synthetic'`, `is_verified=False` |

`--purge` deletes exactly those rows and nothing else. The command **refuses to run when
`ENV != DEV`** unless `--force` is passed.

⚠️ `InternshipAcceptance.save()` raises `ValueError` when `total_hours > 8 × (completion − start)`,
and `offer_letter` is a non-null `FileField` — the seeder must satisfy both.

**Status:** ✅ done

### H-17 · Propagate to the new training models 🟢
`training.TrainingSession` / `SessionAttendance` (T-18's target) have **no views yet**, so nothing
renders from them. Rather than a second seeder, run the existing
`python manage.py backfill_attendance` over the synthetic `AttendanceData`.
**Status:** ✅ done

---

## ✅ Test gate 3 — end-to-end audit

**Per role.** Log in as each and select batch 2026, then 2027, then 2028:

| Role | Page | Expected |
|---|---|---|
| Placement Officer | Dashboard | salary histogram, offer-type breakdown, **timeline spread over months** |
| Placement Officer | Branch-wise report | rows for every department in the cohort |
| Placement Officer | Consolidated report | per-department applied/selected columns |
| Placement Officer | Student performance → Export CSV | file contains imported students |
| Training Officer | Training stats | populated, **and 2026≠2027≠2028** |
| Program Coordinator | Attendance / analytics | filters by department, semester, batch |
| Department Coordinator | Dashboard summary | one tab per batch |
| Student (a 2027 login) | Dashboard | own details, placement status, attendance |
| System Admin | Django admin → a training performance record | opens (this used to crash — `TrainingPerformanceCategory.__str__`) |

**Switching batch must change every number on the page.** If 2026 and 2027 show the same figures,
H-12 is incomplete.

**Automated:**
```bash
docker exec t_and_p_automation-api-1 pytest -q
docker exec t_and_p_automation-api-1 python manage.py makemigrations --check --dry-run
```

---

## Dependency graph

```
IMPLEMENTATION_PLAN T-01..T-04 (breach)  ── must land first, handles real PII
        │
H-01 ─► H-02 ─► H-03            ✅ ground truth
                  │
                  ├─► H-04 ─► H-05 ─► H-06        H2 repair  ─┐
                  │                                            ├─► gate 1
                  └─► H-07 ─► H-08 ─► H-09 ─► H-10   H3 import ─┘
                                        │
                                        ├─► H-11 ─► H-12 ─► H-13, H-14, H-15   H4
                                        └─► H-16 ─► H-17                        H5
```
**Critical path:** H-02 → H-06 → H-09 → H-12.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| UID gate mis-tuned; footer rows imported again | Low | **Severe** | Report prints invalid-row count per file; a *low* count is the alarm |
| Repair deletes the ten real misfiled students | Low | **Severe** | H-05 splits into two passes; the real ones are report-only |
| 1105 account-creation emails exhaust the Gmail quota, OTP login dies | **Was certain** | **Severe** | Users constructed directly, never via `objects.create_user` |
| Batch 2026's 100% placement rate read as a result | High | High | H-15; importer flags the cohort |
| Synthetic data mistaken for real | Medium | High | Three independent markers + `--purge` + DEV-only guard |
| Salary unit conflict makes the consolidation report wrong | **Certain, pre-existing** | Medium | Documented; owned by T-25, not changed here |
| Dept casing variant → silently empty report | Medium | Medium | Normalisation folds to the DB's spelling; `institution.seed` reports near-duplicates |
| Import runs in-request and times out | Low | Low | Management command, not an endpoint (T-31 covers the upload path) |

---

## What this plan cannot deliver

Stated plainly, because the original request asked for it and the data does not exist:

1. **A complete batch 2026 cohort.** 507 placed students, no roster. Every 2026 percentage has a
   missing denominator.
2. **Real attendance, training or internship history** for any batch. H5 fabricates it.
3. **Real notification history.** `Notification` is empty; notifications are generated going
   forward, not backfilled.
4. **Resumes** for historical students. `Resume` is empty and no source contains one.
5. **A correct consolidation-report `employee_type`** — blocked on the salary-unit conflict (T-25).

---

*Derived from a profile of the four source workbooks and the live database at commit `179981f`.
Update each task's Status as work completes.*
