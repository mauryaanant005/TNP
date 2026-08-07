"""Login rate limiting (T-14).

The bug: `key="ip"` reads REMOTE_ADDR, and behind Traefik + Cloudflare Tunnel
every request arrives with the proxy's address. That made "5 logins per minute"
a limit on the entire college — reproduced during the audit with ordinary curl
testing, on valid credentials.

`RATELIMIT_ENABLE` is False for the rest of the suite (it is stateful across
requests and would make test order significant), so these tests re-enable it
explicitly and clear the cache between cases.
"""

import pytest
from django.core.cache import cache
from django.test import override_settings

from tests import factories

pytestmark = pytest.mark.django_db

LOGIN_URL = "/auth/login/"
RESET_URL = "/auth/password_reset/"

# Two students on the same campus NAT / behind the same reverse proxy.
PROXY_IP = "203.0.113.9"


@pytest.fixture(autouse=True)
def _clear_rate_limit_state():
    cache.clear()
    yield
    cache.clear()


@override_settings(RATELIMIT_ENABLE=True)
def test_ten_different_users_can_log_in_within_a_minute_from_one_ip(client):
    """The regression that matters. Before T-14 the sixth of these got a 403
    on valid credentials."""
    users = [factories.UserFactory(password="correct-horse-1") for _ in range(10)]

    for user in users:
        response = client.post(
            LOGIN_URL,
            {"email": user.email, "password": "correct-horse-1"},
            REMOTE_ADDR=PROXY_IP,
            HTTP_X_FORWARDED_FOR=PROXY_IP,
        )
        assert response.status_code != 403, (
            f"{user.email} was rate-limited despite valid credentials — "
            "the limit is keyed on the shared proxy IP again."
        )
        client.logout()


@override_settings(RATELIMIT_ENABLE=True)
def test_repeated_attempts_on_one_account_are_blocked(client):
    """The limit that should exist: per credential, not per campus."""
    user = factories.UserFactory(password="correct-horse-1")

    statuses = []
    for _ in range(8):
        response = client.post(
            LOGIN_URL,
            {"email": user.email, "password": "wrong-password"},
            REMOTE_ADDR=PROXY_IP,
            HTTP_X_FORWARDED_FOR=PROXY_IP,
        )
        statuses.append(response.status_code)

    assert 403 in statuses, "brute-forcing one account was never throttled"
    assert statuses.index(403) >= 5, (
        f"throttled after {statuses.index(403)} attempts; the rate is 5/m"
    )


@override_settings(RATELIMIT_ENABLE=True)
def test_throttling_one_account_does_not_throttle_another(client):
    victim = factories.UserFactory(password="correct-horse-1")
    bystander = factories.UserFactory(password="correct-horse-2")

    for _ in range(8):
        client.post(
            LOGIN_URL,
            {"email": victim.email, "password": "wrong-password"},
            REMOTE_ADDR=PROXY_IP,
            HTTP_X_FORWARDED_FOR=PROXY_IP,
        )

    response = client.post(
        LOGIN_URL,
        {"email": bystander.email, "password": "correct-horse-2"},
        REMOTE_ADDR=PROXY_IP,
        HTTP_X_FORWARDED_FOR=PROXY_IP,
    )

    assert response.status_code != 403


@override_settings(RATELIMIT_ENABLE=True)
def test_password_reset_is_not_limited_college_wide(client):
    """Was 3 per hour for every account combined."""
    users = [factories.UserFactory() for _ in range(6)]

    for user in users:
        response = client.post(
            RESET_URL,
            {"email": user.email},
            REMOTE_ADDR=PROXY_IP,
            HTTP_X_FORWARDED_FOR=PROXY_IP,
        )
        assert response.status_code != 403


def test_settings_trust_the_proxy_header():
    """Only correct because compose publishes no ports, so Traefik is the sole
    ingress and X-Forwarded-For cannot be forged. Re-check if that changes.

    Resolved via a callable rather than the META key directly - naming the key
    made django-ratelimit raise on the two inputs covered below.
    """
    from django.conf import settings

    assert settings.RATELIMIT_IP_META_KEY == "base.ratelimit.client_ip"


@override_settings(RATELIMIT_ENABLE=True)
def test_login_works_without_a_proxy_header(client):
    """The 500 this file previously let through.

    Naming HTTP_X_FORWARDED_FOR as the META key makes django-ratelimit raise
    ImproperlyConfigured when the header is absent, so the login form returned
    500 to anything not behind Traefik. Every test above passes the header
    explicitly, which is exactly why none of them caught it - and
    docker-compose.dev.yml publishes port 8000, so local development hit it on
    the first login attempt.
    """
    user = factories.UserFactory(password="correct-horse-1")

    response = client.post(
        LOGIN_URL,
        {"email": user.email, "password": "correct-horse-1"},
        REMOTE_ADDR="198.51.100.7",  # no HTTP_X_FORWARDED_FOR
    )

    assert response.status_code != 500, (
        "login 500s without X-Forwarded-For - the rate limiter cannot resolve "
        "a client IP when the request did not come through the proxy"
    )


@override_settings(RATELIMIT_ENABLE=True)
def test_multi_entry_forwarded_for_is_accepted(client):
    """X-Forwarded-For is a list: each proxy appends, so a Cloudflare + Traefik
    chain sends "client, edge". django-ratelimit hands the value to
    ipaddress.ip_network(), which rejects a comma-separated string."""
    user = factories.UserFactory(password="correct-horse-1")

    response = client.post(
        LOGIN_URL,
        {"email": user.email, "password": "correct-horse-1"},
        REMOTE_ADDR=PROXY_IP,
        HTTP_X_FORWARDED_FOR=f"198.51.100.7, {PROXY_IP}",
    )

    assert response.status_code != 500, (
        "a multi-hop X-Forwarded-For crashes the rate limiter"
    )


def test_client_ip_prefers_the_original_client_then_falls_back():
    """Unit-level cover for the resolution order itself."""
    from django.test import RequestFactory

    from base.ratelimit import client_ip

    rf = RequestFactory()

    assert client_ip(rf.get("/", HTTP_X_FORWARDED_FOR="198.51.100.7")) == "198.51.100.7"
    # left-most wins: proxies append to the right
    assert (
        client_ip(rf.get("/", HTTP_X_FORWARDED_FOR=" 198.51.100.7 , 203.0.113.9"))
        == "198.51.100.7"
    )
    # absent, and present-but-empty, both fall back to REMOTE_ADDR
    assert client_ip(rf.get("/", REMOTE_ADDR="203.0.113.9")) == "203.0.113.9"
    assert (
        client_ip(rf.get("/", HTTP_X_FORWARDED_FOR="", REMOTE_ADDR="203.0.113.9"))
        == "203.0.113.9"
    )
