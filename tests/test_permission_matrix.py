"""Permission matrix test (T-08).

This is the safety net Phases 2-4 refactor behind. It must FAIL on first run -
specifically on ``role="staff"`` against ``/api/staff/*``, reproducing the known
bug (audit §4.1). A test that passes against unfixed code is testing the code,
not the spec.

The spec is ``docs/PERMISSIONS.md`` / ``tests/permission_matrix.py``. If a case
here fails, the default assumption is that the **code** is wrong. Widening
``allowed_roles`` to make a red test go green is the exact failure mode this
file exists to catch (rule 3, docs/AGENTS_PROMPT.md).
"""

import pytest

from tests.permission_matrix import PERMISSION_MATRIX, flattened

DENIED_STATUSES = {401, 403}


def _request(client, method, path):
    return client.generic(method, path, content_type="application/json")


def _case_id(case):
    role, method, path, expected = case
    return f"{role}|{method}|{path}|{expected}"


ALL_CASES = list(flattened())


@pytest.mark.django_db
@pytest.mark.parametrize("case", ALL_CASES, ids=_case_id)
def test_role_access(api_client, make_user, case):
    role, method, path, expected = case

    user = make_user(role)
    if user is not None:
        api_client.force_login(user)
    # A view that raises must produce a 500 response, not blow up the test -
    # a 500 still tells us authorisation passed, which is what is under test.
    api_client.raise_request_exception = False

    response = _request(api_client, method, path)

    if expected == "deny":
        assert response.status_code in DENIED_STATUSES, (
            f"{role} reached {method} {path} (got {response.status_code}); "
            f"docs/PERMISSIONS.md says it must not."
        )
    else:
        assert response.status_code not in DENIED_STATUSES, (
            f"{role} was refused {method} {path} with {response.status_code}; "
            f"docs/PERMISSIONS.md says it is allowed."
        )


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,path",
    [(m, p) for m, p, _ in PERMISSION_MATRIX],
    ids=lambda v: str(v),
)
def test_superuser_reaches_everything(api_client, make_user, method, path):
    """A superuser is never refused. If this fails, a permission class is
    checking role membership without the is_superuser escape hatch."""
    api_client.force_login(make_user("superuser"))
    api_client.raise_request_exception = False

    response = _request(api_client, method, path)

    assert response.status_code not in DENIED_STATUSES, (
        f"superuser was refused {method} {path} with {response.status_code}"
    )


def test_matrix_covers_every_role():
    """Guard against a rule that forgets a role exists. Every rule must classify
    every role - the flattener does that by construction, so this asserts the
    enum itself has not drifted from the User model."""
    from base.models import User
    from tests.permission_matrix import ALL_ROLES

    model_roles = {choice[0] for choice in User.USER_ROLE_TYPE}
    matrix_roles = set(ALL_ROLES) - {"anonymous"}

    # system_admin is the superuser role and is asserted by the test above
    # rather than per-cell.
    assert model_roles - matrix_roles == {"system_admin"}, (
        "A role exists on the User model but no permission rule classifies it. "
        "Add it to tests/permission_matrix.ALL_ROLES and to docs/PERMISSIONS.md."
    )
