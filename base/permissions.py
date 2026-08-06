from rest_framework.permissions import BasePermission


class IsPlacementOfficerOrAdmin(BasePermission):
    """Allows access to the placement_officer role, plus Django is_staff/is_superuser
    accounts. IsAdminUser alone (is_staff) rejects real placement_officer accounts,
    since regular account creation (CustomUserManager.create_user) never sets
    is_staff - only create_superuser does.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "placement_officer")
        )
