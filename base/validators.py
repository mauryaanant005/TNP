import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

# Mirrors the checklist shown on client_app/src/pages/auth/ResetPassword.tsx.
# Keep the two in step: the frontend's disabled-button gate and this list are
# the only two things standing between a user and a weak password (the
# server-rendered password_update.html form has no client-side check at
# all), so they must require exactly the same things.
PASSWORD_REQUIREMENTS = (
    ("at least 8 characters", lambda p: len(p) >= 8),
    ("one uppercase letter", lambda p: re.search(r"[A-Z]", p) is not None),
    ("one lowercase letter", lambda p: re.search(r"[a-z]", p) is not None),
    ("one number", lambda p: re.search(r"[0-9]", p) is not None),
)


def password_strength_errors(password, user=None):
    """Human-readable reasons `password` is too weak, or `[]` if it passes.

    Combines the composition rules above with Django's own
    AUTH_PASSWORD_VALIDATORS (common-password, username-similarity,
    all-numeric - config/settings.py), which were configured but never
    actually invoked by any of the three password-setting views before this.
    """
    errors = [
        f"Password must contain {label}."
        for label, check in PASSWORD_REQUIREMENTS
        if not check(password)
    ]
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        errors.extend(exc.messages)
    return errors
