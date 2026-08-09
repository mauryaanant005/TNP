"""Placement drives — companies, offers, selection progress (T-19).

Replaces the model layer of `staff/` (misnamed: it was domain-shaped all
along) and `placement_officer/` (a reporting app that happened to own the
category rules).

### Why `db_table` is pinned to the old names

These models are **moved, not recreated**. The rows are live — four batches of
students, their offers and their salaries. So the tables keep their existing
names and the move is state-only: `placements/migrations/0001_initial.py` uses
`SeparateDatabaseAndState` to tell Django the models live here now while
issuing no DDL at all.

That leaves table names carrying an app label that no longer exists, which is
ugly. It is also free of risk, which matters more: renaming a live table is a
deploy-ordering hazard (old code is still running while the rename lands) and
buys nothing but tidiness. If you want the names changed, do it as its own
migration, with the stack down, once this has settled.

Fields are copied **verbatim**. The types are wrong in ways the audit
documents — `min_cgpa` and `salary` are `CharField`s, so eligibility cannot be
filtered in SQL and the consolidation report classifies every offer as "Normal"
(§6.2). Fixing them is T-25. Doing it here, mid-port, would mean a data
migration hiding inside a refactor.
"""

from django.db import models


class Notice(models.Model):
    """The announcement published for a drive."""

    subject = models.CharField(max_length=255)
    date = models.DateField()
    intro = models.TextField()
    about = models.TextField()
    company_registration_link = models.URLField()
    note = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    deadline = models.DateField()

    class Meta:
        db_table = "staff_notice"

    def __str__(self):
        return self.subject


class CompanyRegistration(models.Model):
    """A company running a placement drive for one batch."""

    name = models.CharField(max_length=255)
    batch = models.CharField(max_length=50)

    # ⚠️ Eligibility thresholds as strings (audit §6.2). "Students with CGPA >=
    # this company's minimum" therefore cannot be expressed in SQL and runs in
    # Python over the whole table. T-25.
    min_tenth_marks = models.CharField(max_length=10)
    min_higher_secondary_marks = models.CharField(max_length=10)
    min_cgpa = models.CharField(max_length=10)

    accepted_kt = models.BooleanField(default=False)
    domain = models.CharField(max_length=100)
    departments = models.CharField(max_length=255)

    is_aedp_or_pli = models.BooleanField(default=False)
    is_aedp_or_ojt = models.BooleanField(default=False)
    selected_departments = models.JSONField(default=list)
    notice = models.OneToOneField(Notice, on_delete=models.CASCADE)

    class Meta:
        db_table = "staff_companyregistration"
        constraints = [
            models.UniqueConstraint(fields=["name", "batch"], name="unique_name_batch")
        ]

    def __str__(self):
        return f"{self.name} - {self.batch}"


class JobOffer(models.Model):
    """A role a company is hiring for on a drive."""

    form = models.ForeignKey(
        CompanyRegistration, related_name="job_offers", on_delete=models.CASCADE
    )
    role = models.CharField(max_length=255)
    # ⚠️ A string, and with no unit recorded anywhere. Read as LPA by the
    # dashboard's salary bands and as rupees by the consolidation report's
    # employee_type — so every offer reads "Normal" there. Both behaviours are
    # pinned in tests/test_characterisation_reports.py. T-25.
    salary = models.CharField(max_length=50)
    skills = models.TextField()  # comma-separated or JSON if structured

    class Meta:
        db_table = "staff_joboffer"

    def __str__(self):
        return f"{self.role} ({self.form.name}, {self.form.batch})"


class CategoryRule(models.Model):
    """Thresholds that decide which category a student falls into.

    ⚠️ `category` here uses `Category_1`…`Category_4` while
    `Student.current_category` accepts `Category 1`…`No category`. The rule
    engine writes a value the eligibility ladder cannot match, so a categorised
    student is refused every drive. Pinned in
    tests/test_characterisation_categorisation.py; fixed by T-29.
    """

    CATEGORY_CHOICES = [
        ("Category_1", "Category 1"),
        ("Category_2", "Category 2"),
        ("Category_3", "Category 3"),
        ("Category_4", "Category 4"),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    batch = models.CharField(max_length=50)  # e.g. BE_2023, BE_2024
    minimum_academic_attendance = models.FloatField(null=True, blank=True)
    minimum_academic_performance = models.FloatField(null=True, blank=True)
    minimum_training_attendance = models.FloatField(null=True, blank=True)
    minimum_training_performance = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "placement_officer_categoryrule"
        unique_together = ("category", "batch")
        # ⚠️ Alphabetical on the label, which is the only reason the ladder
        # evaluates Category_1 before Category_2. Renaming the categories
        # silently reorders it. T-29 should add an explicit rank column.
        ordering = ["category"]

    def __str__(self):
        return f"{self.category} - {self.batch}"
