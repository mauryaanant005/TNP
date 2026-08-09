"""Reference data (T-17).

`department`, `batch`, `academic_year`, `division`, `program` and `semester`
are free-text `CharField`s across ~10 models today. One typo creates a phantom
department that silently breaks a report, and the codebase already compensates
with `__iexact`, `.strip()` and `__startswith` prefix matching everywhere —
all symptoms of the tables that should have existed (audit §6.4).

**This app changes no behaviour yet.** It creates the target tables and seeds
them from the distinct values already in the data. T-24 converts the free-text
columns into foreign keys pointing here, and that migration is the one that has
to report unmapped values rather than dropping rows.

Every model here is looked up case-insensitively, because the existing data is
inconsistently cased and the point of this app is to make one canonical row
win.
"""

from django.db import models


class ReferenceData(models.Model):
    """Shared shape: a short canonical code plus a human name.

    `code` is unique and compared case-insensitively at lookup time — see
    `resolve()`. It is not lower-cased on save, because the display form
    ("AI&DS", "CMPN") is what appears on reports.
    """

    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["code"]

    def __str__(self):
        return self.code

    @classmethod
    def resolve(cls, value):
        """Return the row matching `value`, or None.

        Case- and whitespace-insensitive, because that is how the free-text
        data actually looks. Returns None rather than creating a row: T-24's
        migration must *report* an unmapped value, never invent a department.
        """
        if value is None:
            return None
        cleaned = str(value).strip()
        if not cleaned:
            return None
        return cls.objects.filter(code__iexact=cleaned).first()


class Department(ReferenceData):
    """An academic department — CMPN, IT, EXTC, AI&DS.

    This is the department *only*. `Student.department` currently mixes
    department and division into one string ("IT-A"), which is why every
    scoping filter in the codebase is a prefix match. T-24 splits them.
    """


class Division(models.Model):
    """A division within a department — A, B, C.

    Divisions are per-department: "IT-A" and "CMPN-A" are different groups of
    students that happen to share a letter, so this is not a `ReferenceData`
    with a globally unique code.
    """

    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="divisions"
    )
    code = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["department__code", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["department", "code"], name="uniq_division_per_department"
            )
        ]

    def __str__(self):
        return f"{self.department.code}-{self.code}"


class Batch(ReferenceData):
    """A graduating cohort, identified by its passing year — "2025".

    `Student.save()` derives this from the two-digit UID suffix, so the values
    in the data are four-digit year strings. `CategoryRule.batch` instead holds
    "BE_2024"-style values; T-24 has to reconcile the two.
    """

    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta(ReferenceData.Meta):
        ordering = ["-code"]
        verbose_name_plural = "batches"


class AcademicYear(ReferenceData):
    """Year of study — FE, SE, TE, BE.

    Distinct from `Batch`: a batch is fixed for a student's whole degree, an
    academic year advances every year.
    """

    order = models.PositiveSmallIntegerField(default=0)

    class Meta(ReferenceData.Meta):
        ordering = ["order", "code"]


class Program(ReferenceData):
    """A training program — ACT_Technical, ACT_Aptitude, Coding_Contest, SDP.

    Currently duplicated as `PROGRAM_OPTIONS` in `base/models.py` and as free
    text in `program_name` columns across the five attendance models.
    """


class Semester(ReferenceData):
    """Semester 1 … Semester 8.

    A table rather than a choices list because `SEM_OPTIONS` is duplicated in
    two modules and contains a confirmed value/label mismatch —
    `("Semester 7", "Semester 8")` (audit §6.8, T-30). Seeding this correctly
    is what lets that be fixed in one place.
    """

    number = models.PositiveSmallIntegerField(unique=True)

    class Meta(ReferenceData.Meta):
        ordering = ["number"]
