"""Placement business logic (T-19, and T-21 applied as we go).

Views are HTTP adapters. Everything that decides *what is true* lives here, as
plain functions over the ORM — testable without spinning up a request, a
session or a serializer.

**Behaviour is preserved exactly**, including the parts that are wrong. This is
a port, not a rewrite: `tests/test_characterisation_*.py` pin the current
outputs and will fail on any change. Each known defect is marked ⚠️ with the
task that fixes it. Do not fix one here — a behaviour change hidden inside a
move is the diff nobody can review.
"""

from collections import defaultdict

from django.db.models import (
    Avg,
    Case,
    CharField,
    Count,
    FloatField,
    Q,
    Value,
    When,
)
from django.db.models.functions import Cast, TruncMonth

from placements.models import CategoryRule, CompanyRegistration, JobOffer
from student.models import (
    PlacementCompanyProgress,
    Student,
    StudentOffer,
    StudentPlacementAppliedCompany,
)

# The rounds a drive tracks, in the order they appear on the report.
# ⚠️ Hardcoded booleans on PlacementCompanyProgress — cannot express "3
# technical rounds" or a case study. T-28 replaces them with SelectionRound.
PROGRESS_FIELDS = [
    "registered",
    "aptitude_test",
    "coding_test",
    "technical_interview",
    "hr_interview",
    "gd",
]


# ---------------------------------------------------------------------------
# Eligibility
# ---------------------------------------------------------------------------

def _salary_tier(salary):
    """low (<5) / mid (5-10) / high (>=10). Units are LPA by convention only —
    nothing enforces it (T-25)."""
    if salary < 5:
        return "low"
    if salary < 10:
        return "mid"
    return "high"


def _passes_hard_gates(student, company):
    """The checks that reject before the category ladder is consulted."""
    if (
        float(student.tenth_grade or 0) < float(company.min_tenth_marks)
        or float(student.higher_secondary_grade or 0)
        < float(company.min_higher_secondary_marks)
        or float(student.cgpa or 0) < float(company.min_cgpa)
    ):
        return False
    if student.is_blacklisted:
        return False
    if student.is_kt and not company.accepted_kt:
        return False

    if company.is_aedp_or_pli:
        offer_type = "AEDP_PLI"
    elif company.is_aedp_or_ojt:
        offer_type = "AEDP_OJT"
    else:
        offer_type = "PLACEMENT"

    if offer_type == "AEDP_PLI" and student.consent != "placement+aedp/pli":
        return False
    if offer_type == "PLACEMENT" and student.consent not in [
        "placement",
        "placement+aedp/pli",
    ]:
        return False
    return True


def _category_allows(student, job_offers):
    """The category ladder: may this student take one of these offers?

    ⚠️ Branches on `Category 1/2/3` only. A student whose `current_category` is
    the default "No category" — or anything the rule engine wrote, which uses
    underscores — falls off the end and is refused every drive. T-29.
    """
    category = student.current_category
    accepted_offers = student.student_offers.filter(status__in=["accepted", "joined"])

    for job_offer in job_offers:
        try:
            salary = float(job_offer.salary)
        except (ValueError, TypeError):
            continue

        if category == "Category 3":
            if salary > 5:
                continue
            if accepted_offers.exists():
                continue
            return True

        if category == "Category 2":
            if salary > 10:
                continue
            if accepted_offers.filter(salary__gte=5).exists() and salary < 5:
                continue
            if accepted_offers.filter(salary__gte=10).exists():
                continue
            return True

        if category == "Category 1":
            if accepted_offers.filter(salary__gte=10).exists():
                continue
            existing_tiers = {
                _salary_tier(float(o.salary)) for o in accepted_offers if o.salary
            }
            if _salary_tier(salary) in existing_tiers:
                continue
            if "mid" in existing_tiers and salary < 5:
                continue
            if "high" in existing_tiers and salary < 10:
                continue
            return True

    return False


def is_student_eligible_for_offer(student, company, offer):
    """Can this student apply for this specific offer?

    Used by the student-facing apply flow. Refuses anyone who has already
    joined a company.
    """
    if not _passes_hard_gates(student, company):
        return False
    if student.joined_company:
        return False
    return _category_allows(student, [offer])


def is_student_eligible(student, company):
    """Is this student eligible for *any* of the company's offers?

    Used to build the "notify eligible students" broadcast.

    ⚠️ This and `is_student_eligible_for_offer` disagree, and always have. This
    one ignores `Student.joined_company` and instead refuses only those holding
    a joined AEDP_PLI offer — so a student who has joined a standard placement
    is filtered out of the apply flow but still receives "you are eligible"
    emails. Pinned in tests/test_characterisation_eligibility.py.
    """
    if not _passes_hard_gates(student, company):
        return False
    if student.student_offers.filter(status="joined", offer_type="AEDP_PLI").exists():
        return False

    job_offers = company.job_offers.all()
    if not job_offers.exists():
        return False
    return _category_allows(student, job_offers)


def eligible_student_ids(company):
    """Ids of every student eligible for `company`'s drive."""
    students = Student.objects.filter(
        batch=company.batch,
        academic_year="BE",
        is_blacklisted=False,
    )
    if company.selected_departments:
        students = students.filter(department__in=company.selected_departments)
    if not company.accepted_kt:
        students = students.filter(is_kt=False)

    students = students.select_related("user").prefetch_related("student_offers")
    return [s.id for s in students if is_student_eligible(s, company)]


# ---------------------------------------------------------------------------
# Categorisation
# ---------------------------------------------------------------------------

def categorize(
    academic_attendance,
    academic_performance,
    training_attendance,
    training_performance,
    batch,
):
    """First `CategoryRule` for `batch` whose every threshold is cleared.

    ⚠️ Returns `Category_1`…`Category_4` / `Category_NA`, none of which are
    valid `Student.current_category` values. T-29.
    """
    import numpy as np

    if any(
        x is None or np.isnan(x)
        for x in [
            academic_attendance,
            academic_performance,
            training_attendance,
            training_performance,
        ]
    ):
        return "Category_NA"

    for rule in CategoryRule.objects.filter(batch=batch).order_by("category"):
        if (
            academic_attendance >= rule.minimum_academic_attendance
            and academic_performance >= rule.minimum_academic_performance
            and training_attendance >= rule.minimum_training_attendance
            and training_performance >= rule.minimum_training_performance
        ):
            return rule.category

    return "Category_4"


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def placement_dashboard(batch):
    """Charts for the placement officer's dashboard.

    ⚠️ "Placed" here means *any* StudentOffer row exists, whatever its status —
    so a student who has merely been offered a job counts.
    `students.services.department_summary` uses `accepted`/`joined` instead, so
    the two dashboards disagree over identical data. Pinned in
    tests/test_characterisation_reports.py.
    """
    offers = StudentOffer.objects.filter(student__batch=batch).annotate(
        salary_float=Cast("salary", FloatField())
    )

    offer_category = Case(
        When(salary_float__lt=5, then=Value("Normal")),
        When(salary_float__gte=5, salary_float__lte=10, then=Value("Dream")),
        When(salary_float__gt=10, then=Value("Super Dream")),
        default=Value("N/A"),
        output_field=CharField(),
    )
    salary_band = Case(
        When(salary_float__lt=5, then=Value("0-5 LPA")),
        When(salary_float__gte=5, salary_float__lt=7, then=Value("5-7 LPA")),
        When(salary_float__gte=7, salary_float__lt=10, then=Value("7-10 LPA")),
        When(salary_float__gte=10, salary_float__lt=15, then=Value("10-15 LPA")),
        When(salary_float__gte=15, then=Value("15+ LPA")),
        default=Value("Other"),
        output_field=CharField(),
    )

    total_students = Student.objects.filter(batch=batch).count()
    placed_students = (
        Student.objects.filter(batch=batch, student_offers__isnull=False)
        .distinct()
        .count()
    )

    return {
        "placementsOverTime": [
            {"month": row["month"].strftime("%b %Y"), "placements": row["placements"]}
            for row in offers.annotate(month=TruncMonth("offer_date"))
            .values("month")
            .annotate(placements=Count("id"))
            .order_by("month")
        ],
        "departmentPerformance": list(
            Student.objects.filter(batch=batch)
            .values("department")
            .annotate(
                total=Count("id"),
                placed=Count("student_offers", distinct=True),
                avg_salary=Avg("student_offers__salary"),
            )
            .order_by("-placed")
        ),
        "salaryDistribution": list(
            offers.annotate(range=salary_band)
            .values("range")
            .annotate(count=Count("id"))
            .order_by("range")
        ),
        "offerCategoryBreakdown": list(
            offers.annotate(name=offer_category)
            .values("name")
            .annotate(value=Count("id"))
            .order_by("name")
        ),
        "placementStatusFunnel": [
            {"name": "Total Students", "value": total_students},
            {"name": "Placed", "value": placed_students},
            {"name": "Unplaced", "value": total_students - placed_students},
        ],
        "topRecruiters": list(
            offers.values("company__name")
            .annotate(hires=Count("student_id", distinct=True))
            .order_by("-hires")[:10]
        ),
        "topJobRoles": list(
            offers.values("role").annotate(count=Count("id")).order_by("-count")[:10]
        ),
    }


def branchwise_report(batch):
    """Per-department counts of how far applicants got with each company."""
    companies = CompanyRegistration.objects.filter(batch=batch)
    company_ids = list(companies.values_list("id", flat=True))

    departments = (
        Student.objects.filter(batch=batch)
        .values_list("department", flat=True)
        .distinct()
        .order_by("department")
    )

    def zero_counts():
        counts = {field: 0 for field in PROGRESS_FIELDS}
        counts["final"] = 0
        return counts

    report = defaultdict(lambda: defaultdict(zero_counts))

    # Two aggregate queries rather than a loop over every application - each
    # returns one row per (department, company) that actually exists, not one
    # row per student.
    progress_rows = (
        StudentPlacementAppliedCompany.objects.filter(
            student__batch=batch, company_id__in=company_ids
        )
        .values("student__department", "company_id")
        .annotate(
            **{
                field: Count("id", filter=Q(**{f"application__{field}": True}))
                for field in PROGRESS_FIELDS
            }
        )
    )
    for row in progress_rows:
        for field in PROGRESS_FIELDS:
            report[row["student__department"]][row["company_id"]][field] = row[field]

    final_rows = (
        StudentOffer.objects.filter(student__batch=batch, company_id__in=company_ids)
        .values("student__department", "company_id")
        .annotate(final=Count("id"))
    )
    for row in final_rows:
        report[row["student__department"]][row["company_id"]]["final"] = row["final"]

    rows = []
    for department in departments:
        row = {"department": department}
        for company_id in company_ids:
            counts = report[department][company_id]
            for field in PROGRESS_FIELDS:
                row[f"company_{company_id}_{field}"] = counts[field]
            row[f"company_{company_id}_final"] = counts["final"]
        rows.append(row)

    return {
        "company_headers": list(companies.values("id", "name")),
        "progress_fields": PROGRESS_FIELDS + ["final"],
        "report_data": rows,
    }


def consolidation_report(batch):
    """One row per job offer, with applied/selected counts per department.

    ⚠️ Two defects, both pinned:
    - `employee_type` compares an LPA salary against **rupee** thresholds, so
      every offer comes out "Normal" (T-25).
    - Column keys are per department-*division* ("applied_it_a"), because
      `Student.department` holds "IT-A" (T-24).
    """
    departments = list(
        Student.objects.filter(batch=batch)
        .values_list("department", flat=True)
        .distinct()
    )

    annotations = {}
    for department in departments:
        key = department.lower().replace("&", "").replace(" ", "_").replace("-", "_")
        annotations[f"applied_{key}"] = Count(
            "offer",
            filter=Q(
                offer__student__department__istartswith=department,
                offer__student__batch=batch,
            ),
            distinct=True,
        )
        annotations[f"selected_{key}"] = Count(
            "student_offers",
            filter=Q(student_offers__student__department__istartswith=department),
            distinct=True,
        )

    base_fields = [
        "id",
        "role",
        "salary",
        "form__name",
        "form__notice__date",
        "form__is_aedp_or_pli",
    ]

    rows = []
    for item in (
        JobOffer.objects.select_related("form", "form__notice")
        .annotate(**annotations)
        .values(*base_fields, *annotations.keys())
    ):
        salary = int(item.get("salary") or 0)
        if salary < 500000:
            item["employee_type"] = "Normal"
        elif salary < 1000000:
            item["employee_type"] = "Dream"
        else:
            item["employee_type"] = "Super Dream"
        rows.append(item)
    return rows


def student_detail_rows(batch, department=None):
    """Students for the detail report, with their progress prefetched.

    Returns (queryset, a function that attaches progress to a page). The split
    exists because the view paginates first and only then needs the progress
    for the current page - loading it for the whole batch would defeat the
    pagination.
    """
    students = (
        Student.objects.filter(batch=batch)
        .select_related("user")
        .prefetch_related("student_offers__company", "applied_companies__application")
        .order_by("uid")
    )
    if department:
        students = students.filter(department__istartswith=department)
    return students


def attach_progress(students, batch):
    """Attach `all_progress` to each student and return the companies actually
    involved, so the serializer only emits columns that mean something."""
    companies = list(CompanyRegistration.objects.filter(batch=batch))

    progress_rows = PlacementCompanyProgress.objects.filter(
        application__student_id__in=[s.id for s in students]
    ).select_related("application")

    by_student = defaultdict(list)
    active_company_ids = set()
    for progress in progress_rows:
        by_student[progress.application.student_id].append(progress)
        active_company_ids.add(progress.application.company_id)

    for student in students:
        student.all_progress = by_student[student.id]
        for offer in student.student_offers.all():
            active_company_ids.add(offer.company_id)

    return [c for c in companies if c.id in active_company_ids]


def consent_breakdown():
    """⚠️ Not scoped to anything.

    The endpoint accepts a `year` and computes a batch suffix from it, then
    never uses either — every query is `Student.objects.all()`. So the report is
    college-wide and all-time whichever year you ask for. Pinned; unscheduled.
    """
    return {
        "consent_graph": list(
            Student.objects.all().values("consent").annotate(count=Count("consent"))
        ),
        "consent_counts_by_branch": list(
            Student.objects.all().values("department").annotate(count=Count("consent"))
        ),
    }


def consent_by_department(department):
    return list(
        Student.objects.filter(department__istartswith=department)
        .values("consent")
        .annotate(count=Count("consent"))
    )


def unique_departments(batch=None):
    students = Student.objects.filter(batch=batch) if batch else Student.objects.all()
    return list(students.values_list("department", flat=True).distinct())


def category_breakdown(department=None):
    """⚠️ Filters `academic_year="BE"` and ignores batch, so this is also
    all-time — except when a department is given, which drops the year filter
    instead. Two different scopes behind one report."""
    if department:
        students = Student.objects.filter(department__istartswith=department)
    else:
        students = Student.objects.filter(academic_year="BE")
    return list(
        students.values("current_category").annotate(count=Count("current_category"))
    )


def students_in_category(category, batch):
    return list(
        Student.objects.filter(current_category=category, batch=batch).values(
            "id", "current_category", "academic_year"
        )
    )
