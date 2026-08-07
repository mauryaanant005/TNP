"""Client IP resolution for django-ratelimit.

Pointed at by `RATELIMIT_IP_META_KEY`. Exists because reading
`HTTP_X_FORWARDED_FOR` out of `request.META` directly - the obvious
configuration, and what this project used before - raises on two inputs that
occur in normal operation:

* **No header at all.** django-ratelimit raises `ImproperlyConfigured`, which
  surfaces as a 500 on the login form. Every request through Traefik carries
  the header, so production was fine, but anything reaching Gunicorn directly
  had no way to log in - including local development, where
  `docker-compose.dev.yml` deliberately publishes port 8000.

* **More than one entry.** `X-Forwarded-For` is a list: each proxy appends, so
  behind Cloudflare *and* Traefik the value is `"client, edge"`. The library
  passes the value straight to `ipaddress.ip_network()`, which rejects a
  comma-separated string with `ValueError`.
"""


def client_ip(request):
    """Return the client IP for rate-limit bucketing.

    Prefers the left-most `X-Forwarded-For` entry - each proxy appends to the
    right, so the original client is first - and falls back to `REMOTE_ADDR`
    when the header is absent.

    Trust note: the left-most entry is attacker-supplied on a direct request,
    so an IP bucket can be evaded by forging it. That is tolerable here only
    because the IP limits are the coarse secondary control (100/m); the limit
    that actually protects an account is keyed on the submitted email
    (`key="post:email"`, 5/m), which a client cannot spoof away. Revisit this
    if an IP limit is ever made the primary defence - behind Cloudflare the
    unforgeable source is the `CF-Connecting-IP` header.
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    for candidate in forwarded.split(","):
        candidate = candidate.strip()
        if candidate:
            return candidate
    return request.META.get("REMOTE_ADDR") or "0.0.0.0"
