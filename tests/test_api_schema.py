"""OpenAPI schema (T-22).

The schema is what the typed TS client is generated from, so it has to keep
building. These tests are deliberately shallow — they assert the schema
generates, covers the endpoints, and stays in step with the committed copy.
They do not assert its contents endpoint by endpoint; `tsc` does that on the
frontend side, which is the point of generating types at all.
"""

import pytest
from django.urls import reverse
from drf_spectacular.generators import SchemaGenerator

pytestmark = pytest.mark.django_db


@pytest.fixture(scope="module")
def schema():
    return SchemaGenerator().get_schema(request=None, public=True)


def test_schema_generates(schema):
    """A serializer that cannot be introspected makes generation raise. Since
    the frontend build consumes this, a broken schema is a broken deploy."""
    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "TNP Portal API"


def test_schema_covers_the_api(schema):
    """Not an exact count — that would fail on every new endpoint. A floor,
    so an accidental URLconf change that drops half the API is caught."""
    assert len(schema["paths"]) > 70


@pytest.mark.parametrize(
    "path",
    [
        "/api/notifications/",
        "/api/student/info/",
        "/api/staff/placement/company/",
        "/api/department_coordinator/student-data/",
    ],
)
def test_representative_endpoints_are_present(schema, path):
    assert path in schema["paths"], f"{path} missing from the generated schema"


def test_schema_endpoint_is_reachable(api_client, make_user):
    api_client.force_login(make_user("student"))

    response = api_client.get(reverse("schema"))

    assert response.status_code == 200


def test_committed_schema_is_current(schema):
    """Guards against the generated files going stale.

    `client_app/src/lib/generated/schema.yaml` is committed and the TS types are
    built from it. If a serializer changes and nobody regenerates, the frontend
    keeps compiling against the old shape and the drift is invisible until
    runtime — which is the failure this whole task exists to prevent.

    Compares the set of paths rather than the full document: formatting and key
    ordering are not worth failing a build over, a missing endpoint is.
    """
    from pathlib import Path

    import yaml

    committed_path = (
        Path(__file__).resolve().parent.parent
        / "client_app" / "src" / "lib" / "generated" / "schema.yaml"
    )
    if not committed_path.exists():
        pytest.skip("no committed schema yet")

    committed = yaml.safe_load(committed_path.read_text(encoding="utf-8"))

    generated_paths = set(schema["paths"])
    committed_paths = set(committed.get("paths", {}))

    assert generated_paths == committed_paths, (
        "The committed OpenAPI schema is out of date. Regenerate it:\n"
        "  python manage.py spectacular --file client_app/src/lib/generated/schema.yaml\n"
        "  cd client_app && npm run generate:api\n"
        f"  only in code:     {sorted(generated_paths - committed_paths)}\n"
        f"  only in committed:{sorted(committed_paths - generated_paths)}"
    )
