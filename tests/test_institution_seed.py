"""Reference-data seeding (T-17).

The seeder's job is to be *honest about the mess*, not to tidy it. These tests
pin that: a typo must survive seeding as its own row and be reported, because
merging "AI&DS" into "AI&DSA" is a decision that changes which students belong
to which department, and only a human can make it.
"""

import pytest

from institution.models import (
    AcademicYear,
    Batch,
    Department,
    Division,
    Program,
    Semester,
)
from institution.services import _split_department_and_division, seed_from_existing_data
from tests import factories

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Splitting "IT-A" into a department and a division
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "value,expected",
    [
        ("IT-A", ("IT", "A")),
        ("CMPN-B", ("CMPN", "B")),
        ("CIVIL", ("CIVIL", None)),
        # The one that matters: a department whose own name contains a hyphen
        # must not be split at the wrong place.
        ("AI&DS-A", ("AI&DS", "A")),
        ("  IT-A  ", ("IT", "A")),
        # A trailing part too long to be a division is part of the name.
        ("MECH-PROD", ("MECH-PROD", None)),
    ],
)
def test_department_division_split(value, expected):
    assert _split_department_and_division(value) == expected


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

def test_seeds_one_department_per_distinct_value():
    factories.StudentFactory(uid="0001-IT001-25", department="IT-A", division="A")
    factories.StudentFactory(uid="0002-IT002-25", department="IT-B", division="B")
    factories.StudentFactory(uid="0003-CM001-25", department="CMPN-A", division="A")

    seed_from_existing_data()

    assert set(Department.objects.values_list("code", flat=True)) == {"IT", "CMPN"}


def test_divisions_are_scoped_to_their_department():
    factories.StudentFactory(uid="0001-IT001-25", department="IT-A", division="A")
    factories.StudentFactory(uid="0002-CM001-25", department="CMPN-A", division="A")

    seed_from_existing_data()

    # Two rows, not one: "IT-A" and "CMPN-A" are different groups of students.
    assert Division.objects.count() == 2
    assert {str(d) for d in Division.objects.all()} == {"IT-A", "CMPN-A"}


def test_a_typo_is_kept_and_reported_not_merged():
    """The headline behaviour. Seeding must not guess."""
    factories.StudentFactory(uid="0001-AI001-25", department="AI&DS-A", division="A")
    factories.StudentFactory(uid="0002-AI002-25", department="AI&DSA-A", division="A")

    report = seed_from_existing_data()

    # Both survive - nothing was silently merged.
    assert set(Department.objects.values_list("code", flat=True)) == {"AI&DS", "AI&DSA"}
    # And the pair is flagged for a human.
    flagged = {tuple(sorted((a, b))) for table, a, b in report.suspicious if table == "department"}
    assert ("AI&DS", "AI&DSA") in flagged


def test_prefix_collisions_are_flagged():
    """`department__istartswith="IT"` also matched "ITC" - the bug this
    reference table exists to remove. Seeding surfaces the pair."""
    factories.StudentFactory(uid="0001-IT001-25", department="IT", division="A")
    factories.StudentFactory(uid="0002-ITC01-25", department="ITC", division="A")

    report = seed_from_existing_data()

    flagged = {tuple(sorted((a, b))) for table, a, b in report.suspicious if table == "department"}
    assert ("IT", "ITC") in flagged


def test_seeding_is_idempotent():
    factories.StudentFactory(uid="0001-IT001-25", department="IT-A", division="A")

    first = seed_from_existing_data()
    second = seed_from_existing_data()

    assert first.created["department"] == 1
    assert second.created["department"] == 0
    assert second.existing["department"] == 1
    assert Department.objects.count() == 1


def test_batch_records_its_graduation_year():
    factories.StudentFactory(uid="0001-IT001-25", department="IT-A")

    seed_from_existing_data()

    batch = Batch.resolve("2025")
    assert batch is not None
    assert batch.graduation_year == 2025


def test_semesters_are_canonical_not_copied_from_the_data():
    """`SEM_OPTIONS` contains ("Semester 7", "Semester 8") - a confirmed
    value/label mismatch (T-30). Seeding from the data would reproduce it, so
    semesters come from a canonical list instead."""
    seed_from_existing_data()

    assert Semester.objects.count() == 8
    assert list(Semester.objects.values_list("number", "code")) == [
        (n, f"Semester {n}") for n in range(1, 9)
    ]


def test_academic_years_are_canonical_and_ordered():
    seed_from_existing_data()

    assert list(AcademicYear.objects.values_list("code", flat=True)) == [
        "FE",
        "SE",
        "TE",
        "BE",
    ]


def test_unexpected_academic_year_is_reported():
    factories.StudentFactory(uid="0001-IT001-25", department="IT-A", academic_year="Final")

    report = seed_from_existing_data()

    assert any(table == "academic_year" and a == "Final" for table, a, _ in report.suspicious)


def test_programs_include_the_declared_options_even_with_no_attendance_rows():
    seed_from_existing_data()

    from base.models import PROGRAM_OPTIONS

    assert set(Program.objects.values_list("code", flat=True)) >= {
        code for code, _ in PROGRAM_OPTIONS
    }


# ---------------------------------------------------------------------------
# resolve()
# ---------------------------------------------------------------------------

def test_resolve_is_case_and_whitespace_insensitive():
    Department.objects.create(code="CMPN")

    assert Department.resolve("cmpn").code == "CMPN"
    assert Department.resolve("  CMPN  ").code == "CMPN"


def test_resolve_returns_none_rather_than_creating():
    assert Department.resolve("NOSUCHDEPT") is None
    assert Department.objects.count() == 0


def test_resolve_handles_empty_input():
    assert Department.resolve(None) is None
    assert Department.resolve("") is None
    assert Department.resolve("   ") is None
