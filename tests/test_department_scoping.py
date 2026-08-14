"""Behaviour tests for the Principal/Program-Coordinator data-flow fixes.

Complements tests/test_permission_matrix.py, which only asserts *who may
reach* an endpoint. These assert what the endpoint actually *returns* -
department scoping, division matching, and the college-wide-role bypass.
"""

import pytest

from tests import factories


def _login_as(api_client, role, department=None):
    """Log in a fresh user for `role`. If `department` is given, attach a
    FacultyResponsibility with exactly that department (overriding whatever
    default tests/conftest.SCOPED_ROLES would otherwise imply)."""
    user = factories.UserFactory(role=role)
    if department is not None:
        factories.FacultyResponsibilityFactory(user=user, department=department)
    api_client.force_login(user)
    return api_client


def _seed_student_with_attendance(department, division, uid, batch="2025"):
    factories.StudentFactory(uid=uid, department=department, division=division, batch=batch)
    factories.AttendanceDataFactory(uid=uid, batch=batch, program_name="Technical", present="Present")


@pytest.mark.django_db
class TestAvgDataDepartmentScoping:
    """program_coordinator_api.views.get_avg_data (/api/program_coordinator/avg-data/<t>/).

    Previously queried Student.objects.all() unconditionally, so a program
    coordinator scoped to one department received Branch_Div rows for every
    department in the college.
    """

    URL = "/api/program_coordinator/avg-data/attendance_data/"

    def test_program_coordinator_only_sees_own_department(self, api_client):
        _seed_student_with_attendance("CMPN", "A", "0001-CMPN001-25")
        _seed_student_with_attendance("IT", "A", "0002-ITXX002-25")

        client = _login_as(api_client, "program_coordinator", department="CMPN")
        response = client.get(self.URL)

        assert response.status_code == 200
        branches = {row["Branch_Div"] for row in response.json()}
        assert branches == {"CMPN-A"}

    def test_coordinator_sees_composite_department_divisions(self, api_client):
        """Some Student rows store the division merged into `department`
        ("IT-A") instead of a bare department with `division` set
        separately - the `field__istartswith("IT-")` branch of
        department_match_q (base/permissions.py) exists for exactly this
        case. A coordinator owning "IT" must still see these rows."""
        _seed_student_with_attendance("IT-A", "A", "0003-ITXX003-25")

        client = _login_as(api_client, "program_coordinator", department="IT")
        response = client.get(self.URL)

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_coordinator_with_no_responsibility_row_sees_nothing(self, api_client):
        """Fails closed: a misconfigured account (no FacultyResponsibility)
        must not fall back to seeing every department."""
        _seed_student_with_attendance("CMPN", "A", "0004-CMPN004-25")

        client = _login_as(api_client, "program_coordinator")  # no department
        response = client.get(self.URL)

        assert response.status_code == 200
        assert response.json() == []

    def test_principal_sees_every_department(self, api_client):
        """Principal has no FacultyResponsibility row - college-wide roles
        must bypass department scoping rather than being failed closed."""
        _seed_student_with_attendance("CMPN", "A", "0005-CMPN005-25")
        _seed_student_with_attendance("IT", "A", "0006-ITXX006-25")

        client = _login_as(api_client, "principal")
        response = client.get(self.URL)

        assert response.status_code == 200
        branches = {row["Branch_Div"] for row in response.json()}
        assert branches == {"CMPN-A", "IT-A"}


@pytest.mark.django_db
class TestStudentAnalyticsCollegeWideRoles:
    """StudentAnalyticsViewSet previously called scope_to_department()
    unconditionally, so principal/training_officer - who never carry a
    FacultyResponsibility row by design - always got an empty queryset
    despite docs/PERMISSIONS.md granting them access.
    """

    URL = "/api/program_coordinator/student-analytics/"

    @staticmethod
    def _results(response):
        body = response.json()
        return body["results"] if isinstance(body, dict) and "results" in body else body

    @pytest.mark.parametrize("role", ["principal", "training_officer"])
    def test_college_wide_role_is_not_zeroed_out(self, api_client, role):
        factories.StudentFactory(department="CMPN", batch="2025")

        client = _login_as(api_client, role)
        response = client.get(self.URL)

        assert response.status_code == 200
        assert len(self._results(response)) == 1

    def test_department_role_without_responsibility_still_fails_closed(self, api_client):
        """The fix must not weaken the existing fail-closed rule for the
        roles it actually protects."""
        factories.StudentFactory(department="CMPN", batch="2025")

        client = _login_as(api_client, "program_coordinator")  # no department
        response = client.get(self.URL)

        assert response.status_code == 200
        assert self._results(response) == []


@pytest.mark.django_db
class TestPlacementReportBatches:
    """/api/placement_officer/report-batches/ must reflect batches with real
    Student data, not raw CompanyRegistration.batch - a drive can be
    registered for a batch (e.g. 2031) before any Student row for it exists,
    which previously sent Principal/Placement-Coordinator dashboards to a
    year with nothing to show.
    """

    URL = "/api/placement_officer/report-batches/"

    def test_excludes_batches_with_no_students(self, api_client):
        factories.StudentFactory(uid="0001-CMPN001-25", batch="2025")
        factories.CompanyRegistrationFactory(batch="2031")

        client = _login_as(api_client, "principal")
        response = client.get(self.URL)

        assert response.status_code == 200
        assert response.json() == ["2025"]

    def test_sorted_most_recent_first(self, api_client):
        factories.StudentFactory(uid="0001-CMPN001-24", batch="2024")
        factories.StudentFactory(uid="0002-CMPN002-26", batch="2026")

        client = _login_as(api_client, "placement_officer")
        response = client.get(self.URL)

        assert response.status_code == 200
        assert response.json() == ["2026", "2024"]
