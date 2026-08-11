"""Creating and updating ``Student`` + its login, idempotently.

``uid`` is the only identifier this schema has — there is no PRN, roll number
or enrolment column anywhere — so every upsert is keyed on it.

Two things here are easy to get wrong and expensive to undo:

**Account-creation email.** ``CustomUserManager._create_user`` calls
``send_mail`` for every account. Importing 1105 students through the manager
means 1105 emails, and Gmail's ~500/day cap means the OTP sender then stops
working. Users are therefore constructed directly and saved — never via
``objects.create_user``.

**Batch is derived, not assigned.** ``Student.save()`` overwrites ``batch``
from the UID's trailing two digits. That is the schema's rule and this module
does not fight it; it just means a row's UID is the authority on which cohort
it lands in, and a UID whose suffix disagrees with its file gets reported.
"""

from __future__ import annotations

import os
from functools import lru_cache

from django.contrib.auth.hashers import make_password

from base.models import User
from student.models import Student

from . import normalize

# Register rows carry no email address. Batch 2026 has no roster at all, so
# those students can only ever get a synthesised login. The domain matches what
# is already in the database for these rows, so re-importing does not churn
# 636 accounts; when a real roster arrives, `sync_user` relinks them.
PLACEHOLDER_DOMAIN = "student.tcet.ac.in"


def placeholder_email(uid: str) -> str:
    return f"{uid.strip().lower()}@{PLACEHOLDER_DOMAIN}"


def is_placeholder(email: str | None) -> bool:
    return bool(email) and email.lower().endswith("@" + PLACEHOLDER_DOMAIN)


def _default_password() -> str:
    return os.getenv("DEFAULT_SEED_PASSWORD", "tcet@1234")


@lru_cache(maxsize=1)
def _default_password_hash() -> str:
    """Hash the seed password once, not once per student.

    PBKDF2 at Django 5's default iteration count costs ~100 ms. Every imported
    account gets the same seed password, so hashing per row turned a 1105-row
    roster into two minutes of pure key derivation. One hash, reused, is
    identical in effect — the salt is shared across seeded accounts, which is
    acceptable precisely because the password is not secret and every user is
    expected to reset it.
    """
    return make_password(_default_password())


def sync_user(email, full_name, report, existing=None):
    """Return the ``User`` for *email*, creating or correcting as needed.

    *existing* is the student's current user, if any. When a roster supplies a
    real address for a student who currently holds a placeholder one, the
    placeholder is upgraded in place rather than leaving two accounts behind.
    """
    email = (email or "").strip().lower()
    if not email:
        return existing

    match = User.objects.filter(email__iexact=email).first()

    if match:
        if full_name and match.full_name != full_name:
            match.full_name = full_name
            match.save(update_fields=["full_name"])
        if existing and existing.pk != match.pk and is_placeholder(existing.email):
            # The student was on a synthesised login and the real account
            # already exists. Point the student at the real one; the stub is
            # removed by the caller once it is detached.
            report.users_relinked += 1
        return match

    if existing and is_placeholder(existing.email) and not is_placeholder(email):
        # Upgrade the synthesised address to the real one. Keeps the account's
        # id, its password and anything already linked to it.
        existing.email = email
        if full_name:
            existing.full_name = full_name
        existing.save(update_fields=["email", "full_name"])
        report.users_relinked += 1
        return existing

    user = User(
        email=email,
        full_name=full_name or email.split("@")[0],
        role="student",
        password=make_password(_default_password()),
    )
    user.save()
    report.users_created += 1
    return user


# Fields the register may set on a student it did not create. Deliberately
# narrow: a register must never blank out roster-sourced personal details.
_REGISTER_SAFE_FIELDS = ("department", "division", "academic_year")


def upsert_student(uid, fields, report, *, source_kind, dry_run=False):
    """Create or update one student. Returns ``(student, created)``.

    *fields* is a dict of ``Student`` attributes. Keys whose value is ``None``
    are dropped, so a sparse register row cannot overwrite a full roster row
    with blanks.
    """
    uid = normalize.clean_text(uid)
    fields = {k: v for k, v in fields.items() if v is not None}

    student = Student.objects.filter(uid=uid).select_related("user").first()

    if student is None:
        if dry_run:
            report.students_created += 1
            return None, True
        student = Student(uid=uid, **fields)
        student.save()
        report.students_created += 1
        return student, True

    if source_kind == "register":
        # Only fill gaps. The roster is authoritative for anything it owns.
        fields = {
            k: v for k, v in fields.items()
            if k in _REGISTER_SAFE_FIELDS and not getattr(student, k)
        }

    changed = [k for k, v in fields.items() if getattr(student, k) != v]
    if not changed:
        report.students_unchanged += 1
        return student, False

    if dry_run:
        report.students_updated += 1
        return student, False

    for key in changed:
        setattr(student, key, fields[key])
    student.save()
    report.students_updated += 1
    return student, False


def attach_user(student, user, report, *, dry_run=False):
    """Point *student* at *user*, cleaning up a detached placeholder account."""
    if user is None or student is None:
        return
    previous = student.user
    if previous is not None and previous.pk == user.pk:
        return
    if dry_run:
        return

    student.user = user
    student.save(update_fields=["user"])

    if previous is not None and is_placeholder(previous.email) and \
            not Student.objects.filter(user=previous).exists():
        previous.delete()
        report.deleted["placeholder login accounts"] += 1
