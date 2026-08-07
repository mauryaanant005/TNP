"""The single authorisation layer (T-10).

Before this module there were three mechanisms — DRF permission classes,
`IsAdminUser` (19 sites), and inline `if user.role != "x"` checks (~20 sites) —
with no source of truth, which is how a `staff` user ended up locked out of
`/api/staff/*` while a `faculty` user was let in (audit §4.1).

There is now exactly one:

    from base.permissions import HasRole, ROLES

    class CompanyListCreateView(generics.CreateAPIView):
        permission_classes = [HasRole.of(*ROLES.PLACEMENT_DRIVE)]

The spec these classes implement is `docs/PERMISSIONS.md`; the test that holds
them to it is `tests/test_permission_matrix.py`. Adding a role to a tuple here
without changing both is the failure mode the matrix exists to catch.

**`is_staff` is never consulted.** It means "may open the Django admin" and
nothing else. `CustomUserManager.create_user` does not set it, so any API rule
that reads it rejects every ordinary account and admits whoever was granted
admin access — which is precisely the bug this module replaces.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class ROLES:
    """Named role groups, so a rule is written once and referenced by name.

    Views import these instead of repeating role tuples — the duplication is
    what let the same concept drift into three spellings across six apps.
    """

    #: Runs placement drives: companies, offers, applicant progress, exports.
    PLACEMENT_DRIVE = ("staff", "placement_officer")

    #: Reads college-wide placement reports.
    PLACEMENT_REPORTS = ("placement_officer", "principal")

    #: Delivers a training program and records attendance for it.
    TRAINING_DELIVERY = ("faculty", "program_coordinator")

    #: Owns training data across programs.
    TRAINING_ADMIN = ("program_coordinator", "training_officer")

    #: May pull the training template.
    TRAINING_ALL = ("faculty", "program_coordinator", "training_officer")

    #: Reads training/student analytics; each of these is additionally scoped
    #: to the caller's own department by DepartmentScopedMixin.
    ANALYTICS = (
        "faculty",
        "program_coordinator",
        "department_coordinator",
        "training_officer",
        "principal",
    )

    #: Owns one department's students.
    DEPARTMENT = ("department_coordinator",)

    #: Verifies and reports on internships.
    INTERNSHIP = ("internship_officer", "staff")

    #: Aggregate training data across the college.
    TRAINING_OVERSIGHT = ("training_officer", "principal")

    #: Self-service.
    STUDENT = ("student",)


class HasRole(BasePermission):
    """Allow a request when `request.user.role` is in `roles`.

    Superusers always pass. Build a concrete class with `of()`:

        permission_classes = [HasRole.of("staff", "placement_officer")]

    Pass `read_any=True` when safe methods should be open to *any* logged-in
    user while writes stay restricted — the placement-company endpoints need
    this, because a student must be able to read eligibility criteria before
    deciding whether to apply:

        permission_classes = [HasRole.of(*ROLES.PLACEMENT_DRIVE, read_any=True)]
    """

    roles: tuple = ()
    read_any: bool = False

    @classmethod
    def of(cls, *roles, read_any=False):
        if not roles:
            raise ValueError("HasRole.of() requires at least one role")
        suffix = "_".join(roles) + ("_read_any" if read_any else "")
        return type(f"HasRole_{suffix}", (cls,), {"roles": tuple(roles), "read_any": read_any})

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        if self.read_any and request.method in SAFE_METHODS:
            return True
        return getattr(user, "role", None) in self.roles

    def __repr__(self):  # shows up in DRF's browsable API and in test output
        return f"<HasRole {'|'.join(self.roles)}{' +read_any' if self.read_any else ''}>"


class DepartmentScopedMixin:
    """Restrict a queryset to the caller's own department.

    `FacultyResponsibility` is how department and program ownership is recorded.
    Five views previously re-implemented this filtering, each slightly
    differently — `department__iexact`, `department__istartswith`, and one that
    forgot to filter at all.

    Fails closed: a user with no responsibility row sees nothing. That is
    deliberate. A missing row is a misconfigured account, and the safe reading
    of "no department assigned" is "no students", not "all students".

    Superusers are exempt — they are the only accounts that legitimately read
    across departments.
    """

    #: Path from the queryset's model to the department string.
    department_field = "department"

    def get_responsibility(self):
        from base.models import FacultyResponsibility

        return FacultyResponsibility.objects.filter(user=self.request.user).first()

    def get_scoped_department(self):
        responsibility = self.get_responsibility()
        if responsibility and responsibility.department:
            return responsibility.department.strip()
        return None

    def scope_to_department(self, queryset, field=None):
        if getattr(self.request.user, "is_superuser", False):
            return queryset

        department = self.get_scoped_department()
        if not department:
            return queryset.none()

        # Student.department holds "IT-A" while FacultyResponsibility holds
        # "IT", so an exact match silently returns nothing for any department
        # that has divisions. Match the department itself or any of its
        # divisions - never a bare `istartswith`, which would let "IT" also
        # match "ITC".
        from django.db.models import Q

        field = field or self.department_field
        return queryset.filter(
            Q(**{f"{field}__iexact": department})
            | Q(**{f"{field}__istartswith": f"{department}-"})
        )
