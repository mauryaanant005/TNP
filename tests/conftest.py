"""Shared fixtures (T-06)."""

import pytest
from rest_framework.test import APIClient

from tests import factories

# Every role in base.models.User.USER_ROLE_TYPE, plus the two synthetic
# identities the permission matrix needs: an unauthenticated caller and a
# Django superuser.
ALL_ROLES = [
    "student",
    "faculty",
    "staff",
    "department_coordinator",
    "program_coordinator",
    "training_officer",
    "placement_officer",
    "internship_officer",
    "principal",
    "system_admin",
]


@pytest.fixture
def api_client():
    return APIClient()


# Roles that always hold a FacultyResponsibility row in production - it is how
# department and program scoping is expressed. A user in one of these roles
# without one is a misconfigured account, not a normal case, so the fixture
# creates it; "missing responsibility" is covered by its own tests instead.
SCOPED_ROLES = {"faculty", "department_coordinator", "program_coordinator"}


@pytest.fixture
def make_user(db):
    """Create a user for a role name.

    ``anonymous`` returns None; ``superuser`` returns a Django superuser. Every
    other value is a ``User.role`` value and produces an ordinary account -
    crucially with ``is_staff=False``, which is what ``create_user`` does in
    production and what makes the IsAdminUser bug reproducible (audit §4.1).
    """

    def _make(role):
        if role == "anonymous":
            return None
        if role == "superuser":
            return factories.SuperuserFactory()
        user = factories.UserFactory(role=role)
        if role in SCOPED_ROLES:
            factories.FacultyResponsibilityFactory(user=user)
        return user

    return _make


@pytest.fixture
def authenticated_client(api_client, make_user):
    """Return a callable: role name -> logged-in APIClient."""

    def _login(role):
        user = make_user(role)
        if user is not None:
            api_client.force_login(user)
        return api_client

    return _login


@pytest.fixture
def student(db):
    return factories.StudentFactory()


@pytest.fixture
def company(db):
    return factories.CompanyRegistrationFactory()
