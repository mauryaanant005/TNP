"""Seeding the reference tables from existing free-text data (T-17).

Read this before running it: **seeding is a data decision, not a schema one.**
Every distinct string currently in a `department`/`batch`/`program` column
becomes a row, including the typos. That is deliberate — the alternative is
guessing which of "AI&DS" and "AI&DSA" was meant, and a wrong guess silently
merges two departments' students.

The intended workflow is:

1. `seed_from_existing_data()` — creates one row per distinct value.
2. Read `report()` and look at what came out. Near-duplicates are the point.
3. Merge the wrong ones by hand, before T-24 turns the columns into FKs.

Nothing here writes to any existing model. It only fills the new tables.
"""

from dataclasses import dataclass, field

from django.db import transaction

from institution.models import (
    AcademicYear,
    Batch,
    Department,
    Division,
    Program,
    Semester,
)

# Semester is the one table with a fixed, known-correct membership, so it is
# seeded from this list rather than from the data - the data contains the
# SEM_OPTIONS value/label mismatch (T-30) and would seed it back in.
CANONICAL_SEMESTERS = [(n, f"Semester {n}") for n in range(1, 9)]

# Likewise the four years of a degree.
CANONICAL_ACADEMIC_YEARS = [
    (1, "FE", "First Year"),
    (2, "SE", "Second Year"),
    (3, "TE", "Third Year"),
    (4, "BE", "Final Year"),
]


@dataclass
class SeedReport:
    """What seeding did, per table. Printed rather than returned silently -
    the near-duplicates in `created` are the finding."""

    created: dict = field(default_factory=dict)
    existing: dict = field(default_factory=dict)
    suspicious: list = field(default_factory=list)

    def as_text(self):
        lines = ["Reference data seed report", "=" * 60]
        for table in sorted(set(self.created) | set(self.existing)):
            lines.append(
                f"{table:<16} created {self.created.get(table, 0):>4}"
                f"   already present {self.existing.get(table, 0):>4}"
            )
        if self.suspicious:
            lines += [
                "",
                "POSSIBLE DUPLICATES - one of each pair is probably a typo.",
                "Merge them by hand BEFORE running T-24, or the FK migration",
                "will happily point students at both.",
                "",
            ]
            for table, a, b in self.suspicious:
                lines.append(f"  {table:<14} {a!r}  ~  {b!r}")
        else:
            lines += ["", "No near-duplicate codes detected."]
        return "\n".join(lines)


def _distinct(model, field_name):
    """Distinct, stripped, non-empty values of a column."""
    raw = model.objects.values_list(field_name, flat=True).distinct()
    return sorted({str(v).strip() for v in raw if v is not None and str(v).strip()})


def _looks_like_duplicate(a, b):
    """Cheap near-duplicate check: same after case-folding and stripping
    separators, or one is a strict prefix of the other.

    Prefix matching is included because that is the specific failure this
    codebase already has - `department__istartswith="IT"` also matches "ITC".
    """
    norm = lambda s: s.casefold().replace("-", "").replace("_", "").replace(" ", "").replace("&", "")
    na, nb = norm(a), norm(b)
    if na == nb:
        return True
    return na.startswith(nb) or nb.startswith(na)


def _find_suspicious(table, codes):
    out = []
    for i, a in enumerate(codes):
        for b in codes[i + 1 :]:
            if _looks_like_duplicate(a, b):
                out.append((table, a, b))
    return out


def _seed(model, codes, report, table_name, defaults_by_code=None):
    defaults_by_code = defaults_by_code or {}
    created = existing = 0
    for code in codes:
        defaults = defaults_by_code.get(code, {})
        _, was_created = model.objects.get_or_create(code=code, defaults=defaults)
        created += int(was_created)
        existing += int(not was_created)
    report.created[table_name] = created
    report.existing[table_name] = existing
    report.suspicious.extend(_find_suspicious(table_name, codes))


def _split_department_and_division(value):
    """"IT-A" -> ("IT", "A"); "CIVIL" -> ("CIVIL", None).

    Only the *last* hyphen-separated part is treated as a division, and only
    when it is one or two characters - "AI&DS-A" must not become ("AI", "DS-A").
    """
    cleaned = str(value).strip()
    if "-" not in cleaned:
        return cleaned, None
    head, _, tail = cleaned.rpartition("-")
    if head and 1 <= len(tail) <= 2 and tail.isalnum():
        return head, tail.upper()
    return cleaned, None


@transaction.atomic
def seed_from_existing_data():
    """Populate the reference tables from the values already in the database."""
    # Imported here rather than at module scope: institution/ must not create
    # an import cycle with the apps it is eventually going to be referenced by.
    from program_coordinator_api.models import AttendanceData
    from placements.models import CompanyRegistration
    from student.models import Student

    report = SeedReport()

    # --- Department and Division -----------------------------------------
    # Student.department holds department+division in one string ("IT-A"), and
    # Student.division holds the division separately as well. Read them as an
    # actual pair per student so divisions are only created where they exist -
    # crossing every department with every division letter would invent groups.
    dept_codes, division_pairs = set(), set()
    for dept_value, div_value in (
        Student.objects.values_list("department", "division").distinct()
    ):
        if not dept_value:
            continue
        dept, div_from_dept = _split_department_and_division(dept_value)
        dept_codes.add(dept)
        div = (str(div_value).strip().upper() if div_value else None) or div_from_dept
        if div:
            division_pairs.add((dept, div))

    # FacultyResponsibility holds the bare department name.
    from base.models import FacultyResponsibility

    dept_codes.update(_distinct(FacultyResponsibility, "department"))

    _seed(Department, sorted(dept_codes), report, "department")

    created = existing = 0
    for dept_code, div_code in sorted(division_pairs):
        department = Department.resolve(dept_code)
        if department is None:
            continue
        _, was_created = Division.objects.get_or_create(
            department=department, code=div_code
        )
        created += int(was_created)
        existing += int(not was_created)
    report.created["division"] = created
    report.existing["division"] = existing

    # --- Batch ------------------------------------------------------------
    batch_codes = set(_distinct(Student, "batch"))
    batch_codes.update(_distinct(CompanyRegistration, "batch"))
    batch_codes.update(_distinct(AttendanceData, "batch"))
    year_defaults = {}
    for code in batch_codes:
        digits = "".join(ch for ch in code if ch.isdigit())
        if len(digits) == 4:
            year_defaults[code] = {"graduation_year": int(digits)}
    _seed(Batch, sorted(batch_codes), report, "batch", defaults_by_code=year_defaults)

    # --- Program ----------------------------------------------------------
    program_codes = set(_distinct(AttendanceData, "program_name"))
    from base.models import PROGRAM_OPTIONS

    program_codes.update(code for code, _ in PROGRAM_OPTIONS)
    _seed(Program, sorted(program_codes), report, "program")

    # --- AcademicYear and Semester ---------------------------------------
    # Seeded from the canonical lists, not from the data: the data contains the
    # SEM_OPTIONS mismatch and would reproduce it.
    created = existing = 0
    for order, code, name in CANONICAL_ACADEMIC_YEARS:
        _, was_created = AcademicYear.objects.get_or_create(
            code=code, defaults={"name": name, "order": order}
        )
        created += int(was_created)
        existing += int(not was_created)
    report.created["academic_year"] = created
    report.existing["academic_year"] = existing

    created = existing = 0
    for number, code in CANONICAL_SEMESTERS:
        _, was_created = Semester.objects.get_or_create(
            number=number, defaults={"code": code, "name": code}
        )
        created += int(was_created)
        existing += int(not was_created)
    report.created["semester"] = created
    report.existing["semester"] = existing

    # Any academic_year value in the data that is not one of FE/SE/TE/BE is a
    # finding, not something to seed silently.
    for value in _distinct(Student, "academic_year"):
        if AcademicYear.resolve(value) is None:
            report.suspicious.append(("academic_year", value, "<not FE/SE/TE/BE>"))

    return report
