"""Read-time notification targeting (T-23).

The change replaces a materialised M2M — one through-table row per user per
broadcast — with resolution from the targeting metadata at read time. That is
only safe if the new rules agree *exactly* with the old ones, so the central
test here is an equivalence test: for a generated matrix of users and
audiences, `_resolve_recipients()` (the old write-time query, still present)
and `targeting.matches()` (the new read-time predicate) must select the same
people.

If you change a targeting rule, change it in both and watch this test.
"""

import pytest

from base.models import User
from notifications.models import Notification
from notifications.targeting import _Recipient, matches, visible_to
from notifications.views import _resolve_recipients
from tests import factories

pytestmark = pytest.mark.django_db


AUDIENCES = [
    "all_users",
    "all_students",
    "all_faculty",
    "all_staff",
    "all_placement_officers",
    "all_training_officers",
    "all_internship_officers",
    "department_students",
    "year_students",
    "department_faculty",
]


@pytest.fixture
def population():
    """A cross-section: every role, students in two departments and two years,
    a faculty member with a responsibility row, and a student user with no
    Student record (which the old query silently excluded)."""
    people = {}

    people["it_be"] = factories.StudentFactory(
        uid="0001-ITC001-25", department="IT-A", academic_year="BE"
    ).user
    people["it_te"] = factories.StudentFactory(
        uid="0002-ITC002-26", department="IT-B", academic_year="TE"
    ).user
    people["cmpn_be"] = factories.StudentFactory(
        uid="0003-CMPN003-25", department="CMPN-A", academic_year="BE"
    ).user

    # A user with role=student but no Student row.
    people["ghost_student"] = factories.UserFactory(role="student")

    faculty = factories.UserFactory(role="faculty")
    factories.FacultyResponsibilityFactory(user=faculty, department="IT")
    people["faculty_it"] = faculty

    for role in ["staff", "placement_officer", "training_officer",
                 "internship_officer", "principal"]:
        people[role] = factories.UserFactory(role=role)

    return people


def _make(audience, creator, departments=None, years=None):
    return Notification.objects.create(
        title="t",
        message="m",
        creator=creator,
        target_audience=audience,
        target_departments=departments or [],
        target_academic_years=years or [],
    )


# ---------------------------------------------------------------------------
# The equivalence test
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("audience", AUDIENCES)
@pytest.mark.parametrize(
    "departments,years",
    [
        ([], []),
        (["IT"], []),
        ([], ["BE"]),
        (["IT"], ["BE"]),
        (["CMPN"], ["TE"]),
    ],
    ids=["no-filter", "dept-IT", "year-BE", "IT+BE", "CMPN+TE"],
)
def test_read_time_targeting_matches_the_old_write_time_query(
    population, audience, departments, years
):
    creator = population["staff"]
    notification = _make(audience, creator, departments, years)

    old = set(
        _resolve_recipients(audience, departments, years, creator).values_list(
            "id", flat=True
        )
    )
    # The old code added the creator unconditionally after resolving.
    old.add(creator.id)

    new = {
        user.id
        for user in User.objects.all()
        if matches(notification, _Recipient(user))
    }

    assert new == old, (
        f"audience={audience} departments={departments} years={years}\n"
        f"  only old: {sorted(old - new)}\n"
        f"  only new: {sorted(new - old)}"
    )


# ---------------------------------------------------------------------------
# The point of the change
# ---------------------------------------------------------------------------

def test_a_broadcast_writes_no_recipient_rows(population, api_client):
    """The whole task. Previously this wrote one row per student."""
    creator = population["staff"]
    api_client.force_login(creator)

    response = api_client.post(
        "/api/notifications/",
        {"title": "Placement drive", "message": "Tomorrow",
         "target_audience": "all_students"},
    )

    assert response.status_code == 201
    notification = Notification.objects.get()
    assert notification.recipients.count() == 0, (
        "recipients were materialised — the fan-out is back"
    )


def test_students_still_receive_an_untargeted_broadcast(population):
    creator = population["staff"]
    notification = _make("all_students", creator)

    for key in ["it_be", "it_te", "cmpn_be"]:
        assert notification in visible_to(population[key]), key

    assert notification not in visible_to(population["placement_officer"])


def test_a_student_account_with_no_student_record_receives_nothing(population):
    """Existing behaviour, preserved: `_resolve_recipients` joins through the
    Student table, so `role="student"` alone is not enough. Worth knowing —
    it means a half-provisioned account silently gets no notifications."""
    notification = _make("all_students", population["staff"])

    assert notification not in visible_to(population["ghost_student"])


def test_department_targeting_reaches_divisions(population):
    """FacultyResponsibility stores "IT" while Student.department stores
    "IT-A" — the prefix rule the old query used has to survive."""
    creator = population["staff"]
    notification = _make("department_students", creator, departments=["IT"])

    assert notification in visible_to(population["it_be"])
    assert notification in visible_to(population["it_te"])
    assert notification not in visible_to(population["cmpn_be"])


def test_department_targeting_does_not_leak_across_a_prefix_collision(population):
    """"IT" must not match "ITC" — the bug that motivated institution/."""
    itc = factories.StudentFactory(
        uid="0009-ITC009-25", department="ITC", academic_year="BE"
    ).user
    notification = _make("department_students", population["staff"], departments=["IT"])

    assert notification not in visible_to(itc)


def test_year_targeting(population):
    notification = _make("year_students", population["staff"], years=["BE"])

    assert notification in visible_to(population["it_be"])
    assert notification not in visible_to(population["it_te"])


def test_creator_always_sees_their_own_notification(population):
    """Even when the audience excludes them entirely."""
    creator = population["placement_officer"]
    notification = _make("all_students", creator)

    assert notification in visible_to(creator)


def test_unrelated_roles_do_not_see_a_student_broadcast(population):
    notification = _make("all_students", population["staff"])

    for key in ["faculty_it", "placement_officer", "training_officer", "principal"]:
        assert notification not in visible_to(population[key]), key


# ---------------------------------------------------------------------------
# Legacy rows
# ---------------------------------------------------------------------------

def test_legacy_materialised_recipients_still_resolve(population):
    """Notifications created before this change have through-table rows and
    possibly stale metadata. They must not vanish from anyone's inbox."""
    creator = population["staff"]
    legacy = Notification.objects.create(
        title="old", message="m", creator=creator,
        # Metadata that targets nobody...
        target_audience="all_internship_officers",
    )
    # ...but a materialised recipient.
    legacy.recipients.add(population["it_be"])

    assert legacy in visible_to(population["it_be"])
    assert legacy not in visible_to(population["cmpn_be"])


# ---------------------------------------------------------------------------
# Read state
# ---------------------------------------------------------------------------

def test_unread_count_and_mark_read_work_without_materialised_recipients(
    population, api_client
):
    student = population["it_be"]
    notification = _make("all_students", population["staff"])
    api_client.force_login(student)

    unread = api_client.get("/api/notifications/unread-count/")
    assert unread.status_code == 200
    assert unread.json()["unread_count"] == 1

    marked = api_client.patch(f"/api/notifications/{notification.id}/mark-read/")
    assert marked.status_code == 200

    unread = api_client.get("/api/notifications/unread-count/")
    assert unread.json()["unread_count"] == 0


def test_listing_notifications_does_not_scale_queries_with_row_count(
    population, api_client
):
    """Read-time resolution must not become an N+1.

    The risk is real: `visible_to()` refines candidates in Python, and a naive
    version would issue two queries per notification to re-fetch the same
    Student and FacultyResponsibility rows. `_Recipient` fetches them once.

    The invariant asserted is *growth*, not an absolute count — the absolute
    number depends on session and auth middleware and would make this a
    brittle test of unrelated machinery. Seeded at two volumes, ten times
    apart; the count must not move.
    """
    from django.db import connection
    from django.test.utils import CaptureQueriesContext

    creator = population["staff"]
    api_client.force_login(population["it_be"])

    def count_queries_for_a_list_request():
        with CaptureQueriesContext(connection) as captured:
            assert api_client.get("/api/notifications/").status_code == 200
        return len(captured)

    for _ in range(5):
        _make("all_students", creator)
    baseline = count_queries_for_a_list_request()

    for _ in range(45):
        _make("all_students", creator)
    at_ten_times_the_volume = count_queries_for_a_list_request()

    assert at_ten_times_the_volume == baseline, (
        f"queries grew from {baseline} to {at_ten_times_the_volume} when "
        f"notifications went from 5 to 50 — resolution is happening "
        f"per-notification instead of per-request"
    )


def test_a_non_recipient_cannot_mark_a_notification_read(population, api_client):
    notification = _make("all_internship_officers", population["staff"])
    api_client.force_login(population["it_be"])

    response = api_client.patch(f"/api/notifications/{notification.id}/mark-read/")

    assert response.status_code == 404
