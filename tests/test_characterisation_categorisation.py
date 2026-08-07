"""Characterisation tests — student categorisation (T-09).

Pins `student/utils.py::categorize`, the CategoryRule engine that decides which
category a student lands in. Same rule as the eligibility file: these record
what the code does today, not what it should do.

⚠️ **The headline finding.** `categorize()` returns `CategoryRule.category`
values (`Category_1` … `Category_4`) and its result is written straight into
`Student.current_category`, whose choices are `Category 1` / `Category 2` /
`Category 3` / `No category` — underscore vs space, and a `Category_4` that has
no counterpart at all. The eligibility ladder then matches on the *spaced*
spelling, so a student categorised by the rule engine matches **no** branch and
is refused every drive. That is audit §6.7 and T-29.
"""

import pytest

from placement_officer.models import CategoryRule
from student.models import Student
from student.utils import categorize

pytestmark = [pytest.mark.django_db, pytest.mark.characterisation]

BATCH = "2025"


def _rule(category, *, acad_att=0, acad_perf=0, train_att=0, train_perf=0, batch=BATCH):
    return CategoryRule.objects.create(
        batch=batch,
        category=category,
        minimum_academic_attendance=acad_att,
        minimum_academic_performance=acad_perf,
        minimum_training_attendance=train_att,
        minimum_training_performance=train_perf,
    )


def test_returns_the_first_rule_the_student_clears_in_category_order():
    _rule("Category_1", acad_att=90, acad_perf=9, train_att=90, train_perf=90)
    _rule("Category_2", acad_att=80, acad_perf=8, train_att=80, train_perf=80)
    _rule("Category_3", acad_att=70, acad_perf=7, train_att=70, train_perf=70)

    assert categorize(95, 9.5, 95, 95, BATCH) == "Category_1"
    assert categorize(85, 8.5, 85, 85, BATCH) == "Category_2"
    assert categorize(75, 7.5, 75, 75, BATCH) == "Category_3"


def test_all_four_metrics_must_clear_the_threshold():
    _rule("Category_1", acad_att=90, acad_perf=9, train_att=90, train_perf=90)
    _rule("Category_2", acad_att=80, acad_perf=8, train_att=80, train_perf=80)

    # Strong on three, one point short on training performance.
    assert categorize(95, 9.5, 95, 85, BATCH) == "Category_2"


def test_clearing_no_rule_falls_through_to_category_4():
    _rule("Category_1", acad_att=90, acad_perf=9, train_att=90, train_perf=90)

    assert categorize(10, 1, 10, 10, BATCH) == "Category_4"


def test_no_rules_for_the_batch_means_category_4():
    _rule("Category_1", acad_att=0, acad_perf=0, train_att=0, train_perf=0, batch="2099")

    assert categorize(95, 9.5, 95, 95, BATCH) == "Category_4"


def test_a_missing_metric_short_circuits_to_category_na():
    _rule("Category_1", acad_att=0, acad_perf=0, train_att=0, train_perf=0)

    assert categorize(None, 9.5, 95, 95, BATCH) == "Category_NA"
    assert categorize(float("nan"), 9.5, 95, 95, BATCH) == "Category_NA"


def test_ordering_is_alphabetical_on_the_category_string():
    """⚠️ Pinned. `order_by("category")` sorts the *label*, so the ladder only
    works because `Category_1` < `Category_2` < … alphabetically. Renaming the
    categories (T-29) silently reorders the ladder unless an explicit rank
    column replaces this."""
    _rule("Category_2", acad_att=80, acad_perf=8, train_att=80, train_perf=80)
    _rule("Category_1", acad_att=90, acad_perf=9, train_att=90, train_perf=90)

    # Created out of order; Category_1 must still win for a strong student.
    assert categorize(95, 9.5, 95, 95, BATCH) == "Category_1"


def test_categorize_output_is_not_a_valid_student_category():
    """⚠️ The bug, pinned. Every value `categorize()` can return is rejected by
    `Student.current_category`'s own choices, and none of them match the
    spellings `is_student_eligible` branches on."""
    _rule("Category_1", acad_att=0, acad_perf=0, train_att=0, train_perf=0)
    result = categorize(95, 9.5, 95, 95, BATCH)

    valid_student_categories = {choice[0] for choice in Student.category_Type}

    assert result == "Category_1"
    assert result not in valid_student_categories
    assert valid_student_categories == {
        "Category 1",
        "Category 2",
        "Category 3",
        "No category",
    }
