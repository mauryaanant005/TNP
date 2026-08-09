"""Who receives a notification, resolved at read time (T-23).

`Notification.recipients` is a ManyToMany. Every broadcast wrote one row per
user into the through table: an "all students" notification at target size is
10,000 rows, ~200 broadcasts a year is ~2M rows plus a slow fan-out at send
time — to store a fact that is already fully determined by three columns the
model *also* stores (`target_audience`, `target_departments`,
`target_academic_years`).

So the fan-out stops. Recipients are computed from the targeting metadata when
somebody reads their notifications, and `NotificationRead` continues to hold
read state — which is genuinely per-user data and genuinely has to be stored.

**This module must agree exactly with `_resolve_recipients()` in views.py**,
which is still the write-time query used for the websocket push.
`tests/test_notification_targeting.py` asserts the two select identical people
over a generated matrix of users, audiences, departments and years. If you
change a rule, change it in both — that test is what tells you.

### Why it filters in Python and then re-queries

`target_departments` is a `JSONField` holding a list, and Django's `contains`
lookup on JSONField is unsupported on SQLite — so "the list contains this
department" cannot be expressed portably in SQL. The queryset is narrowed in
SQL on the indexed `target_audience` column, refined in Python, then turned
back into a queryset by primary key so ordering and pagination still happen in
the database.

The Python step is bounded by *notifications*, not users — a few hundred a year
against ~10,000 users. Revisit if the notification table reaches tens of
thousands of rows; the fix then is a small `NotificationTarget` side table, not
a return to materialising recipients.
"""

from django.db.models import Q

from base.models import FacultyResponsibility
from student.models import Student

# The three student audiences are treated identically by `_resolve_recipients`:
# each applies whatever department and year filters were given. They differ only
# in what the UI offers, not in what they select.
STUDENT_AUDIENCES = {"all_students", "department_students", "year_students"}

# Likewise these two: both mean "faculty", narrowed by department if one was
# named.
FACULTY_AUDIENCES = {"all_faculty", "department_faculty"}

# Audiences that select purely on User.role.
ROLE_ONLY_AUDIENCES = {
    "all_staff": "staff",
    "all_placement_officers": "placement_officer",
    "all_training_officers": "training_officer",
    "all_internship_officers": "internship_officer",
}


def _clean(values):
    return [str(v).strip() for v in (values or []) if str(v).strip()]


def _department_matches(targets, department):
    """Mirrors `_build_department_q`: exact match (case-insensitive), or the
    department is a division of the target — "IT" matches "IT-A".

    Deliberately *not* a bare prefix match: "IT" must not match "ITC".
    """
    if not targets:
        return True  # not narrowed by department
    if not department:
        return False
    own = str(department).strip().casefold()
    return any(
        own == t.casefold() or own.startswith(f"{t.casefold()}-") for t in targets
    )


def _year_matches(targets, academic_year):
    """Mirrors the `academic_year__iexact` OR-chain."""
    if not targets:
        return True
    own = str(academic_year or "").strip().casefold()
    return any(own == t.casefold() for t in targets)


class _Recipient:
    """The facts about a user that targeting depends on, fetched once.

    Without this, deciding membership for N notifications issues 2N queries for
    the same student and responsibility rows.
    """

    def __init__(self, user):
        self.user = user
        self.role = getattr(user, "role", None)
        self.student = (
            Student.objects.filter(user=user)
            .only("department", "academic_year")
            .first()
        )
        self.faculty_departments = [
            d
            for d in FacultyResponsibility.objects.filter(user=user).values_list(
                "department", flat=True
            )
            if d
        ]


def matches(notification, recipient):
    """Is `recipient` (a `_Recipient`) targeted by `notification`?"""
    audience = notification.target_audience
    departments = _clean(notification.target_departments)
    years = _clean(notification.target_academic_years)

    # The creator always sees their own notification — `create()` adds them to
    # the recipient set unconditionally after resolving.
    if notification.creator_id == recipient.user.id:
        return True

    if audience == "all_users":
        return True

    if audience in ROLE_ONLY_AUDIENCES:
        return recipient.role == ROLE_ONLY_AUDIENCES[audience]

    if audience in FACULTY_AUDIENCES:
        # Both audiences require role="faculty". With departments named, the
        # user must also hold a matching FacultyResponsibility.
        if recipient.role != "faculty":
            return False
        if not departments:
            return True
        return any(
            _department_matches(departments, d) for d in recipient.faculty_departments
        )

    if audience in STUDENT_AUDIENCES:
        # `User.objects.filter(students__in=qs, role="student")` — so a user
        # needs BOTH role="student" and an actual Student row. A student
        # account with no Student record receives nothing, which is existing
        # behaviour, preserved.
        if recipient.role != "student" or recipient.student is None:
            return False
        return _department_matches(
            departments, recipient.student.department
        ) and _year_matches(years, recipient.student.academic_year)

    return False


def _candidate_audiences(recipient):
    """Audiences that could possibly include this user — narrows the SQL query
    before the Python refinement."""
    audiences = {"all_users"}
    for audience, role in ROLE_ONLY_AUDIENCES.items():
        if recipient.role == role:
            audiences.add(audience)
    if recipient.role == "student":
        audiences |= STUDENT_AUDIENCES
    if recipient.role == "faculty":
        audiences |= FACULTY_AUDIENCES
    return audiences


def visible_to(user, queryset=None):
    """Notifications `user` should see, as a QuerySet.

    Returns a real queryset so ordering, filtering and pagination stay in the
    database.
    """
    from notifications.models import Notification

    base = Notification.objects.all() if queryset is None else queryset
    recipient = _Recipient(user)

    candidates = base.filter(
        Q(target_audience__in=_candidate_audiences(recipient)) | Q(creator=user)
    ).only(
        "id",
        "creator_id",
        "target_audience",
        "target_departments",
        "target_academic_years",
    )

    matching_ids = [n.id for n in candidates if matches(n, recipient)]

    # Notifications created before this change still have materialised rows in
    # the through table, and their targeting metadata may predate the fields
    # above. Union with them so nothing disappears from anyone's inbox. Once
    # those have aged out, this clause and the `recipients` field itself can go.
    return base.filter(Q(id__in=matching_ids) | Q(recipients=user)).distinct()
