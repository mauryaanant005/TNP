"""The two features T-19 brought back from the dead.

A port is supposed to change structure, not behaviour — and everything else in
T-19 obeys that, held to it by `tests/test_characterisation_reports.py` and
`tests/test_characterisation_eligibility.py`.

These two are the exceptions, and they are exceptions because the alternative
was knowingly re-shipping broken code. Both were features somebody built, that
the frontend still calls, and that could not possibly have worked.
"""

import pytest

from placements.models import CategoryRule
from tests import factories, report_fixture

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# 1. "Notify eligible students" always returned 400
# ---------------------------------------------------------------------------

def test_placement_notification_sends(api_client, make_user):
    """`staff/views.py` passed `type_notification="placement"` to
    `Notification.objects.create()`.

    That field was **removed from the model** in
    `notifications/migrations/0006_remove_notification_type_notification_and_more`.
    Passing it raises `TypeError`, which the view's blanket `except Exception`
    turned into a 400 — so the core "tell eligible students about this drive"
    workflow had been silently dead since that migration, returning a generic
    error every time somebody pressed the button.

    Fixed by passing `category=` instead, which is the field that replaced it.
    """
    data = report_fixture.build()
    api_client.force_login(make_user("placement_officer"))

    response = api_client.post(
        f"/api/staff/placement/company/send_notifications/{data['acme'].id}/",
        {"title": "Acme drive", "content": "Apply by Friday", "sendTo": "registered"},
        format="json",
    )

    assert response.status_code == 201, (
        f"expected the notification to be created, got {response.status_code}: "
        f"{response.content[:300]}"
    )

    from notifications.models import Notification

    notification = Notification.objects.get()
    assert notification.category == "placement"
    assert "Acme" in notification.message


def test_placement_notification_to_eligible_students(api_client, make_user):
    data = report_fixture.build()
    api_client.force_login(make_user("placement_officer"))

    response = api_client.post(
        f"/api/staff/placement/company/send_notifications/{data['acme'].id}/",
        {"title": "Acme drive", "content": "You are eligible", "sendTo": "eligible"},
        format="json",
    )

    # Either it found eligible students (201) or it said so plainly (404).
    # What it must not do is fail with a generic 400.
    assert response.status_code in (201, 404), response.content[:300]


# ---------------------------------------------------------------------------
# 2. Three category-rule pages had no URL behind them
# ---------------------------------------------------------------------------

def test_category_rule_can_be_created(api_client, make_user):
    """`CategoryRuleForm.tsx` has always POSTed here; nothing was routed."""
    api_client.force_login(make_user("placement_officer"))

    response = api_client.post(
        "/api/placement_officer/category-rules/create/",
        {
            "category": "Category_1",
            "batch": "2025",
            "minimum_academic_attendance": 90,
            "minimum_academic_performance": 9,
            "minimum_training_attendance": 90,
            "minimum_training_performance": 90,
        },
        format="json",
    )

    assert response.status_code == 201, response.content[:300]
    assert CategoryRule.objects.filter(category="Category_1", batch="2025").exists()


def test_category_rules_can_be_listed(api_client, make_user):
    CategoryRule.objects.create(
        category="Category_1", batch="2025",
        minimum_academic_attendance=90, minimum_academic_performance=9,
        minimum_training_attendance=90, minimum_training_performance=90,
    )
    api_client.force_login(make_user("placement_officer"))

    response = api_client.get("/api/placement_officer/category-rules/list/")

    assert response.status_code == 200
    assert [r["category"] for r in response.json()] == ["Category_1"]


def test_students_can_be_listed_by_category(api_client, make_user):
    student = factories.StudentFactory(
        uid="0001-ITC001-25", batch="2025", current_category="Category 1"
    )
    factories.StudentFactory(
        uid="0002-ITC002-25", batch="2025", current_category="Category 2"
    )
    api_client.force_login(make_user("placement_officer"))

    response = api_client.get(
        "/api/placement_officer/students/by-category/Category%201/2025/"
    )

    assert response.status_code == 200
    assert [row["id"] for row in response.json()] == [str(student.id)]


# ---------------------------------------------------------------------------
# The move itself
# ---------------------------------------------------------------------------

def test_models_moved_without_moving_their_tables():
    """The whole basis for T-19 being safe on live data.

    `placements.0001` is state-only: it tells Django the models live in
    `placements` now while issuing no DDL. If somebody later 'tidies up' by
    dropping these `db_table` values, Django will happily generate a migration
    that renames four live tables.
    """
    from placements.models import CategoryRule, CompanyRegistration, JobOffer, Notice

    assert Notice._meta.db_table == "staff_notice"
    assert CompanyRegistration._meta.db_table == "staff_companyregistration"
    assert JobOffer._meta.db_table == "staff_joboffer"
    assert CategoryRule._meta.db_table == "placement_officer_categoryrule"


def test_the_old_apps_own_no_models():
    """`staff` and `placement_officer` survive only to carry their applied
    migrations — see the note in `staff/models.py`."""
    from django.apps import apps

    assert list(apps.get_app_config("staff").get_models()) == []
    assert list(apps.get_app_config("placement_officer").get_models()) == []


def test_urls_did_not_change(client):
    """The frontend must not notice this move. Every path the React app calls
    still resolves, to a view in `placements`."""
    from django.urls import resolve

    for path in [
        "/api/staff/placement/company/",
        "/api/staff/companies/batches/",
        "/api/staff/category_update/",
        "/api/placement_officer/dashboard/2025/",
        "/api/placement_officer/branch_wise_report/2025/",
        "/api/placement_officer/consent/",
    ]:
        match = resolve(path)
        module = match.func.__module__
        assert module.startswith("placements"), f"{path} resolves to {module}"
