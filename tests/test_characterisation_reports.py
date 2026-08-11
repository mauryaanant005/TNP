"""Characterisation tests — report endpoints.

**These are the prerequisite for T-19/T-20/T-21.** Those tasks port ~2,500
lines of view code into `placements/` and `students/`, and roughly 1,500 of
those lines build reports that had no test coverage at all. The permission
matrix proves *who can reach* an endpoint; it asserts nothing about *what it
returns*. Without these, a port could change a placement percentage, pass every
test, and be discovered by a coordinator in a report weeks later.

Same rule as the other characterisation files: these pin **current** behaviour,
correct or not. Every expectation below was worked out by hand from
`tests/report_fixture.py` and then compared against the code — not copied from
a run. Where the two disagreed, the disagreement is marked ⚠️ and pinned as-is.
Do not "fix" one of these here; each is a decision, and each is listed in
`docs/PHASE_2_IMPLEMENTATION.md`.

The fixture is 6 students across 2 batches, 2 companies, 3 offers and 3
applications — small enough to verify by inspection.
"""

import json

import pytest

from tests import report_fixture

pytestmark = [pytest.mark.django_db, pytest.mark.characterisation]

BATCH = report_fixture.BATCH


@pytest.fixture
def data():
    return report_fixture.build()


@pytest.fixture
def officer(api_client, make_user):
    api_client.force_login(make_user("placement_officer"))
    return api_client


def _by(rows, key):
    return {row[key]: row for row in rows}


# ---------------------------------------------------------------------------
# /api/placement_officer/dashboard/<batch>/
# ---------------------------------------------------------------------------

def test_dashboard_department_performance(data, officer):
    body = officer.get(f"/api/placement_officer/dashboard/{BATCH}/").json()
    departments = _by(body["departmentPerformance"], "department")

    # Departments are dept+division strings, because that is what
    # Student.department holds. T-24 splits them.
    assert set(departments) == {"IT-A", "IT-B", "CMPN-A"}

    assert departments["IT-A"]["total"] == 2
    assert departments["IT-A"]["placed"] == 2
    assert departments["IT-A"]["avg_salary"] == 10.0  # (8 + 12) / 2

    assert departments["CMPN-A"]["total"] == 2
    assert departments["CMPN-A"]["placed"] == 1
    assert departments["CMPN-A"]["avg_salary"] == 4.0

    assert departments["IT-B"]["total"] == 1
    assert departments["IT-B"]["placed"] == 0
    assert departments["IT-B"]["avg_salary"] is None


def test_dashboard_counts_an_unaccepted_offer_as_placed():
    """⚠️ Pinned, and almost certainly not what "placed" should mean.

    The funnel counts a student as placed if *any* `StudentOffer` row exists,
    whatever its status. `cmpn_a`'s only offer is status="offered" — nobody has
    accepted anything — yet they are counted.

    `DepartmentDashboardSummaryView` computes the same concept as
    `status__in=["accepted", "joined"]`. So the college has two different
    numbers for "how many students are placed", and the placement officer's
    dashboard reports the larger one.
    """
    data = report_fixture.build()
    from student.models import StudentOffer

    assert StudentOffer.objects.get(student=data["cmpn_a"]).status == "offered"


def test_dashboard_placement_funnel(data, officer):
    body = officer.get(f"/api/placement_officer/dashboard/{BATCH}/").json()
    funnel = {row["name"]: row["value"] for row in body["placementStatusFunnel"]}

    # 5 students in batch 2025 — the 2024 student is excluded.
    assert funnel["Total Students"] == 5
    # 3, not 2: see test_dashboard_counts_an_unaccepted_offer_as_placed.
    assert funnel["Placed"] == 3
    assert funnel["Unplaced"] == 2


def test_dashboard_offer_categories_and_salary_bands(data, officer):
    body = officer.get(f"/api/placement_officer/dashboard/{BATCH}/").json()

    # Bands here read StudentOffer.salary as LPA: <5 Normal, 5-10 Dream,
    # >10 Super Dream. Offers are 4.0, 8.0, 12.0.
    assert {row["name"]: row["value"] for row in body["offerCategoryBreakdown"]} == {
        "Normal": 1,
        "Dream": 1,
        "Super Dream": 1,
    }
    assert {row["range"]: row["count"] for row in body["salaryDistribution"]} == {
        "0-5 LPA": 1,
        "7-10 LPA": 1,
        "10-15 LPA": 1,
    }


def test_dashboard_recruiters_and_roles(data, officer):
    body = officer.get(f"/api/placement_officer/dashboard/{BATCH}/").json()

    assert {r["company__name"]: r["hires"] for r in body["topRecruiters"]} == {
        "Acme": 2,
        "Beta": 1,
    }
    assert {r["role"]: r["count"] for r in body["topJobRoles"]} == {
        "Engineer": 2,
        "Analyst": 1,
    }


def test_dashboard_excludes_other_batches(data, officer):
    """The 2024 student has an identical department and must not appear."""
    body = officer.get(f"/api/placement_officer/dashboard/{BATCH}/").json()
    departments = _by(body["departmentPerformance"], "department")

    assert departments["IT-A"]["total"] == 2, "a student from batch 2024 leaked in"


# ---------------------------------------------------------------------------
# /api/placement_officer/branch_wise_report/<batch>/
# ---------------------------------------------------------------------------

def test_branchwise_report_counts_each_round_per_department(data, officer):
    body = officer.get(f"/api/placement_officer/branch_wise_report/{BATCH}/").json()

    companies = {c["name"]: c["id"] for c in body["company_headers"]}
    acme, beta = companies["Acme"], companies["Beta"]
    rows = _by(body["report_data"], "department")

    # IT-A: it_a applied to Acme and cleared aptitude + coding; it_b holds a
    # Beta offer without an application.
    assert rows["IT-A"][f"company_{acme}_registered"] == 1
    assert rows["IT-A"][f"company_{acme}_aptitude_test"] == 1
    assert rows["IT-A"][f"company_{acme}_coding_test"] == 1
    assert rows["IT-A"][f"company_{acme}_hr_interview"] == 0
    assert rows["IT-A"][f"company_{acme}_final"] == 1
    assert rows["IT-A"][f"company_{beta}_final"] == 1

    # CMPN-A: cmpn_a applied and cleared aptitude only.
    assert rows["CMPN-A"][f"company_{acme}_registered"] == 1
    assert rows["CMPN-A"][f"company_{acme}_aptitude_test"] == 1
    assert rows["CMPN-A"][f"company_{acme}_coding_test"] == 0
    assert rows["CMPN-A"][f"company_{acme}_final"] == 1

    # IT-B: it_c applied but was never selected.
    assert rows["IT-B"][f"company_{acme}_registered"] == 1
    assert rows["IT-B"][f"company_{acme}_final"] == 0


def test_branchwise_report_lists_every_department_in_the_batch(data, officer):
    body = officer.get(f"/api/placement_officer/branch_wise_report/{BATCH}/").json()

    assert {row["department"] for row in body["report_data"]} == {
        "IT-A", "IT-B", "CMPN-A",
    }
    assert body["progress_fields"] == [
        "registered", "aptitude_test", "coding_test",
        "technical_interview", "hr_interview", "gd", "final",
    ]


# ---------------------------------------------------------------------------
# /api/placement_officer/get_data_by_year/<batch>/  (ConsolidationReportAPIView)
# ---------------------------------------------------------------------------

def test_consolidation_report_classifies_every_offer_as_normal(data, officer):
    """⚠️ Pinned. This column is wrong, and the fixture shows why.

        salary = int(item.get("salary") or 0)
        if salary < 500000:      emp_type = "Normal"
        elif salary < 1000000:   emp_type = "Dream"
        else:                    emp_type = "Super Dream"

    The thresholds are in **rupees**; `JobOffer.salary` holds **LPA** — the
    same field the dashboard above reads as LPA to build its bands. So an 8 LPA
    offer and a 12 LPA offer are both "Normal", and *no* offer can ever be
    anything else short of somebody typing a salary of 500000 LPA.

    This is Phase 1 characterisation finding #4 (salary has no unit anywhere)
    producing a visibly wrong report column. T-25 gives salary a real type.
    """
    rows = officer.get(f"/api/placement_officer/get_data_by_year/{BATCH}/").json()

    by_company = _by(rows, "form__name")
    assert by_company["Acme"]["salary"] == "8"
    assert by_company["Beta"]["salary"] == "12"
    assert by_company["Acme"]["employee_type"] == "Normal"
    assert by_company["Beta"]["employee_type"] == "Normal", (
        "12 LPA classified as Normal — the thresholds are in rupees"
    )


def test_consolidation_report_columns_are_per_department_division(data, officer):
    """One column pair per *department-division*, not per department — because
    `Student.department` holds "IT-A". Splitting them is T-24."""
    rows = officer.get(f"/api/placement_officer/get_data_by_year/{BATCH}/").json()
    acme = _by(rows, "form__name")["Acme"]

    assert acme["applied_it_a"] == 1
    assert acme["applied_it_b"] == 1
    assert acme["applied_cmpn_a"] == 1
    assert acme["selected_it_a"] == 1
    assert acme["selected_it_b"] == 0
    assert acme["selected_cmpn_a"] == 1


# ---------------------------------------------------------------------------
# /api/placement_officer/consent/
# ---------------------------------------------------------------------------

def test_consent_report_is_double_encoded(data, officer):
    """⚠️ Pinned. The payload is JSON containing JSON *strings*: the view calls
    `json.dumps` and then hands the result to `JsonResponse`. Callers have to
    parse twice. Harmless but load-bearing — a port that returns real objects
    breaks the frontend."""
    body = officer.get("/api/placement_officer/consent/").json()

    assert isinstance(body["consent_graph"], str)
    assert isinstance(body["consent_counts_by_branch"], str)

    consent = {row["consent"]: row["count"] for row in json.loads(body["consent_graph"])}
    assert consent == {"placement": 4, "Higher studies": 1, "Entrepreneurship": 1}


def test_consent_report_honours_the_year_it_is_given(data, officer):
    """The year narrows the report to that batch.

    This test previously pinned the opposite — the endpoint accepted a `year`,
    computed `batch_year_suffix` from it and then used neither, so every query
    was `Student.objects.all()` and the report was college-wide and all-time
    whichever year you asked for. H-12 fixed that, because merging cohorts is
    exactly what breaks once historical batches are imported.
    """
    body = officer.get(f"/api/placement_officer/consent/{BATCH}/").json()
    by_department = {
        row["department"]: row["count"]
        for row in json.loads(body["consent_counts_by_branch"])
    }

    # Three IT-A students exist; only two are in batch 2025.
    assert by_department["IT-A"] == 2, "the 2024 student must not leak into 2025"
    assert by_department["IT-B"] == 1
    assert by_department["CMPN-A"] == 2

    # A different year returns different numbers.
    other = officer.get(f"/api/placement_officer/consent/{report_fixture.OTHER_BATCH}/").json()
    other_by_department = {
        row["department"]: row["count"]
        for row in json.loads(other["consent_counts_by_branch"])
    }
    assert other_by_department["IT-A"] == 1
    assert other["consent_counts_by_branch"] != body["consent_counts_by_branch"]

    # With no year at all the report stays college-wide.
    everyone = officer.get("/api/placement_officer/consent/").json()
    everyone_by_department = {
        row["department"]: row["count"]
        for row in json.loads(everyone["consent_counts_by_branch"])
    }
    assert everyone_by_department["IT-A"] == 3


# ---------------------------------------------------------------------------
# Category and department listings
# ---------------------------------------------------------------------------

def test_category_report_counts_final_year_students_only(data, officer):
    """`get_category` filters `academic_year="BE"` and ignores batch — so this
    is also all-time. Every student in the fixture is BE, including the 2024
    one."""
    body = officer.get("/api/placement_officer/get_category_data/").json()
    counts = {row["current_category"]: row["count"] for row in body["category"]}

    assert counts == {"Category 1": 3, "Category 2": 2, "Category 3": 1}


def test_unique_departments_can_be_scoped_by_batch(data, officer):
    """Unlike `consent/`, this one does honour a `?batch=` query parameter."""
    all_departments = officer.get(
        "/api/placement_officer/unique-departments/"
    ).json()["unique_departments"]
    assert set(all_departments) == {"IT-A", "IT-B", "CMPN-A"}

    scoped = officer.get(
        f"/api/placement_officer/unique-departments/?batch={report_fixture.OTHER_BATCH}"
    ).json()["unique_departments"]
    assert set(scoped) == {"IT-A"}


# ---------------------------------------------------------------------------
# /api/department_coordinator/dashboard-summary/
# ---------------------------------------------------------------------------

def test_department_dashboard_uses_a_stricter_definition_of_placed(
    data, api_client, make_user
):
    """⚠️ The other half of the "placed" inconsistency.

    This view counts only `status__in=["accepted", "joined"]`, so for IT it
    reports 2 placed. The placement officer's dashboard, over the same data,
    reports 3 across all departments because it counts bare offers too.

    Both numbers are defensible. Having both, unlabelled, in one system is not.
    """
    user = make_user("faculty")
    from tests.factories import FacultyResponsibilityFactory

    user.facultyresponsibility_set.all().delete()
    FacultyResponsibilityFactory(user=user, department="IT")
    api_client.force_login(user)

    body = api_client.get("/api/department_coordinator/dashboard-summary/").json()

    assert body["department_name"] == "IT"
    summary = body["summary_by_batch"][BATCH]

    assert summary["total_students"] == 3        # it_a, it_b, it_c
    assert summary["placement_stats"]["actual_placed_count"] == 2
    assert summary["students_with_kt"] == 1      # it_c


def test_department_dashboard_is_scoped_to_its_own_department(
    data, api_client, make_user
):
    """CMPN students must not appear in the IT coordinator's summary."""
    user = make_user("faculty")
    from tests.factories import FacultyResponsibilityFactory

    user.facultyresponsibility_set.all().delete()
    FacultyResponsibilityFactory(user=user, department="CMPN")
    api_client.force_login(user)

    body = api_client.get("/api/department_coordinator/dashboard-summary/").json()

    assert body["department_name"] == "CMPN"
    assert body["summary_by_batch"][BATCH]["total_students"] == 2
