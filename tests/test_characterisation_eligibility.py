"""Characterisation tests — placement eligibility (T-09).

These pin **current** behaviour of `is_student_eligible`, correct or not, so
that Phase 2's rewrite cannot silently change who is eligible for a placement
drive. Where the pinned behaviour looks wrong, it is marked ⚠️ and listed in
`docs/PHASE_1_IMPLEMENTATION.md` for a human decision — do not "fix" it here.
Changing one of these assertions changes who gets a job offer.

Two implementations of the same rule exist:

- `staff/utils.py::is_student_eligible(student, company)` — evaluates every
  JobOffer on the company; used by `get_eligible_students()`, which drives the
  "notify eligible students" broadcast.
- `student/utils.py::is_student_eligible(student, company, offer)` — evaluates
  one specific offer; used when a student applies.

They have already drifted (see `test_the_two_implementations_disagree`). That
drift is a finding, not a fixture bug.
"""

import pytest

from placements.services import is_student_eligible as eligible_any_offer
from placements.services import is_student_eligible_for_offer as eligible_for_offer
from tests import factories

pytestmark = [pytest.mark.django_db, pytest.mark.characterisation]


def _student(**kwargs):
    return factories.StudentFactory(**kwargs)


def _company_with_offer(salary="8", **company_kwargs):
    company = factories.CompanyRegistrationFactory(**company_kwargs)
    offer = factories.JobOfferFactory(form=company, salary=salary)
    return company, offer


# ---------------------------------------------------------------------------
# Hard gates — these reject before any category logic runs
# ---------------------------------------------------------------------------

def test_below_minimum_cgpa_is_ineligible():
    company, offer = _company_with_offer()
    student = _student(cgpa=5.0)  # company min_cgpa is "6.0"

    assert eligible_for_offer(student, company, offer) is False
    assert eligible_any_offer(student, company) is False


def test_below_minimum_tenth_marks_is_ineligible():
    company, offer = _company_with_offer()
    student = _student(tenth_grade=50.0)  # company minimum is "60"

    assert eligible_for_offer(student, company, offer) is False


def test_blacklisted_student_is_ineligible():
    company, offer = _company_with_offer()
    student = _student(is_blacklisted=True)

    assert eligible_for_offer(student, company, offer) is False


def test_kt_student_is_ineligible_unless_company_accepts_kt():
    company, offer = _company_with_offer(accepted_kt=False)
    student = _student(is_kt=True)
    assert eligible_for_offer(student, company, offer) is False

    accepting_company, accepting_offer = _company_with_offer(accepted_kt=True)
    assert eligible_for_offer(student, accepting_company, accepting_offer) is True


def test_higher_studies_consent_blocks_placement():
    company, offer = _company_with_offer()
    student = _student(consent="Higher studies")

    assert eligible_for_offer(student, company, offer) is False


def test_aedp_pli_drive_requires_matching_consent():
    company, offer = _company_with_offer(is_aedp_or_pli=True)

    assert eligible_for_offer(_student(consent="placement"), company, offer) is False
    assert eligible_for_offer(_student(consent="placement+aedp/pli"), company, offer) is True


# ---------------------------------------------------------------------------
# Category ladder
#
# ⚠️ Salary is compared against the bare literals 5 and 10. JobOffer.salary is a
# CharField and StudentOffer.salary a Float; nothing states a unit. These tests
# pin the current interpretation (LPA) because that is what the numbers imply -
# but a company that stores "600000" is treated as > 10 by this code, i.e. as a
# Super Dream offer, whichever unit was intended. T-25 makes this explicit.
# ---------------------------------------------------------------------------

def test_category_3_student_only_eligible_for_offers_up_to_5():
    student = _student(current_category="Category 3")

    low_company, low_offer = _company_with_offer(salary="4")
    high_company, high_offer = _company_with_offer(salary="6")

    assert eligible_for_offer(student, low_company, low_offer) is True
    assert eligible_for_offer(student, high_company, high_offer) is False


def test_category_3_student_with_any_accepted_offer_is_done():
    student = _student(current_category="Category 3")
    factories.StudentOfferFactory(student=student, status="accepted", salary=3.0)

    company, offer = _company_with_offer(salary="4")

    assert eligible_for_offer(student, company, offer) is False


def test_category_2_student_capped_at_10():
    student = _student(current_category="Category 2")

    ok_company, ok_offer = _company_with_offer(salary="9")
    over_company, over_offer = _company_with_offer(salary="11")

    assert eligible_for_offer(student, ok_company, ok_offer) is True
    assert eligible_for_offer(student, over_company, over_offer) is False


def test_category_2_student_holding_a_5_plus_offer_cannot_take_a_lower_one():
    student = _student(current_category="Category 2")
    factories.StudentOfferFactory(student=student, status="accepted", salary=6.0)

    company, offer = _company_with_offer(salary="4")

    assert eligible_for_offer(student, company, offer) is False


def test_category_1_student_cannot_repeat_a_salary_tier():
    """Tiers are low (<5), mid (5-10), high (>=10). One offer per tier."""
    student = _student(current_category="Category 1")
    factories.StudentOfferFactory(student=student, status="accepted", salary=7.0)  # mid

    same_tier_company, same_tier_offer = _company_with_offer(salary="8")
    higher_tier_company, higher_tier_offer = _company_with_offer(salary="12")

    assert eligible_for_offer(student, same_tier_company, same_tier_offer) is False
    assert eligible_for_offer(student, higher_tier_company, higher_tier_offer) is True


def test_category_1_student_with_a_10_plus_offer_is_done():
    student = _student(current_category="Category 1")
    factories.StudentOfferFactory(student=student, status="accepted", salary=15.0)

    company, offer = _company_with_offer(salary="20")

    assert eligible_for_offer(student, company, offer) is False


def test_no_category_student_is_ineligible_for_everything():
    """⚠️ Pinned, and almost certainly not intended. `current_category`
    defaults to "No category", and the ladder has no branch for it - so a
    student who has never been categorised falls off the end of the loop and is
    refused every drive. Audit §6.7 (three competing category systems)."""
    student = _student(current_category="No category")
    company, offer = _company_with_offer(salary="4")

    assert eligible_for_offer(student, company, offer) is False


def test_unparseable_salary_is_skipped_not_rejected():
    student = _student(current_category="Category 1")
    company, offer = _company_with_offer(salary="Negotiable")

    assert eligible_for_offer(student, company, offer) is False


# ---------------------------------------------------------------------------
# The two implementations
# ---------------------------------------------------------------------------

def test_the_two_implementations_disagree_on_joined_students():
    """⚠️ Pinned drift, not a fixture bug.

    `student/utils` refuses anyone with `Student.joined_company = True`.
    `staff/utils` instead refuses anyone holding a *joined AEDP_PLI* offer and
    ignores the flag entirely. So a student who has joined a standard placement
    is filtered out of the apply flow but still counted as eligible by the
    "notify eligible students" broadcast.
    """
    student = _student(current_category="Category 1", joined_company=True)
    company, offer = _company_with_offer(salary="8")

    assert eligible_for_offer(student, company, offer) is False
    assert eligible_any_offer(student, company) is True


def test_staff_implementation_requires_the_company_to_have_offers():
    student = _student(current_category="Category 1")
    company = factories.CompanyRegistrationFactory()  # no JobOffer

    assert eligible_any_offer(student, company) is False


def test_get_eligible_students_filters_by_batch_and_academic_year():
    company = factories.CompanyRegistrationFactory(batch="2025", selected_departments=["CMPN"])
    factories.JobOfferFactory(form=company, salary="4")

    matching = factories.StudentFactory(
        uid="0001-CMPN001-25", department="CMPN", academic_year="BE", current_category="Category 3"
    )
    factories.StudentFactory(
        uid="0002-CMPN002-24", department="CMPN", academic_year="BE", current_category="Category 3"
    )  # wrong batch
    factories.StudentFactory(
        uid="0003-CMPN003-25", department="CMPN", academic_year="TE", current_category="Category 3"
    )  # wrong year

    from placements.services import eligible_student_ids

    assert eligible_student_ids(company) == [matching.id]
