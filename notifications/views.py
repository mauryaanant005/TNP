from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .serializers import NotificationSerializer
from .models import Notification, NotificationRead, TARGET_AUDIENCE_CHOICES
from base.models import User, FacultyResponsibility
from student.models import Student

import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

# Maps each role to the set of target_audience values it is allowed to use.
ROLE_AUDIENCE_PERMISSIONS = {
    "system_admin": {c[0] for c in TARGET_AUDIENCE_CHOICES},  # all
    "principal": {c[0] for c in TARGET_AUDIENCE_CHOICES},
    "staff": {
        "all_students",
        "department_students",
        "year_students",
        "all_faculty",
        "department_faculty",
        "all_staff",
        "all_users",
    },
    "department_coordinator": {
        "department_students",
        "department_faculty",
        "all_students",
        "all_faculty",
    },
    "placement_officer": {
        "all_students",
        "department_students",
        "year_students",
    },
    "training_officer": {
        "all_students",
        "department_students",
        "year_students",
        "all_faculty",
        "department_faculty",
    },
    "internship_officer": {
        "all_students",
        "department_students",
        "year_students",
    },
    "faculty": {
        "department_students",
        "department_faculty",
    },
    # student is intentionally absent — they are blocked in perform_create
}


def _build_department_q(departments):
    """
    Build a Q filter for Student.department that handles both formats:
    - Exact match: 'CIVIL', 'IOT', 'MECH' (single-division departments)
    - Prefix match: 'IT' matches 'IT-A', 'IT-B', 'IT-C'
                    'COMP' matches 'COMP-A', 'COMP-B', 'COMP-C'
    This is necessary because FacultyResponsibility stores the base dept name
    (e.g. 'IT') while Student.department stores dept+division (e.g. 'IT-A').
    """
    from django.db.models import Q
    q = Q()
    for dept in departments:
        # Exact match OR starts-with "<dept>-"
        q |= Q(department__iexact=dept) | Q(department__istartswith=f"{dept}-")
    return q


def _build_faculty_dept_q(departments):
    """
    Build a Q filter for FacultyResponsibility.department using the same
    prefix logic — handles both 'IT' and 'IT-A' style entries.
    """
    from django.db.models import Q
    q = Q()
    for dept in departments:
        q |= Q(department__iexact=dept) | Q(department__istartswith=f"{dept}-")
    return q


def _resolve_recipients(target_audience, departments, academic_years, creator):
    """
    Returns a QuerySet of User objects that should receive the notification,
    given the targeting rule and optional department/year filters.
    """
    role = creator.role

    # For department-scoped roles (faculty, department_coordinator),
    # automatically restrict to their own department if no departments specified.
    dept_scoped_roles = {"faculty", "department_coordinator"}
    if role in dept_scoped_roles and not departments:
        try:
            resp = FacultyResponsibility.objects.filter(user=creator).first()
            if resp:
                departments = [resp.department]
        except Exception:
            pass

    if target_audience == "all_students":
        if not departments and not academic_years:
            return User.objects.filter(role="student")

        qs = Student.objects.all()
        if departments:
            qs = qs.filter(_build_department_q(departments))
        if academic_years:
            qs = qs.filter(academic_year__in=academic_years)
        return User.objects.filter(students__in=qs)

    if target_audience == "department_students":
        qs = Student.objects.all()
        if departments:
            qs = qs.filter(_build_department_q(departments))
        return User.objects.filter(students__in=qs)

    if target_audience == "year_students":
        if not academic_years and not departments:
            return User.objects.filter(role="student")

        qs = Student.objects.all()
        if academic_years:
            qs = qs.filter(academic_year__in=academic_years)
        if departments:
            qs = qs.filter(_build_department_q(departments))
        return User.objects.filter(students__in=qs)

    if target_audience == "all_faculty":
        return User.objects.filter(role="faculty")

    if target_audience == "department_faculty":
        if departments:
            faculty_ids = (
                FacultyResponsibility.objects.filter(_build_faculty_dept_q(departments))
                .values_list("user_id", flat=True)
            )
            return User.objects.filter(id__in=faculty_ids)
        return User.objects.filter(role="faculty")

    if target_audience == "all_staff":
        return User.objects.filter(role="staff")

    if target_audience == "all_placement_officers":
        return User.objects.filter(role="placement_officer")

    if target_audience == "all_training_officers":
        return User.objects.filter(role="training_officer")

    if target_audience == "all_internship_officers":
        return User.objects.filter(role="internship_officer")

    if target_audience == "all_users":
        return User.objects.all()

    return User.objects.none()


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class NotificationListCreate(generics.ListCreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return only notifications for which the requesting user is a recipient,
        ordered newest-first.

        Uses select_related to avoid N+1 on creator lookups, and
        prefetch_related to allow efficient is_read computation per notification.

        Supports optional query params:
        - ?category=<value>  — filter by category
        - ?is_read=true|false — filter by read status
        """
        user = self.request.user
        qs = (
            Notification.objects.filter(recipients=user)
            .select_related("creator")
            .prefetch_related("read_by")
            .order_by("-created_at")
            .distinct()
        )

        # Optional category filter
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        # Optional read/unread filter
        is_read_param = self.request.query_params.get("is_read")
        if is_read_param is not None:
            want_read = is_read_param.lower() == "true"
            read_notification_ids = NotificationRead.objects.filter(
                user=user
            ).values_list("notification_id", flat=True)
            if want_read:
                qs = qs.filter(id__in=read_notification_ids)
            else:
                qs = qs.exclude(id__in=read_notification_ids)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Create a notification and assign recipients based on the target_audience rule.

        Role-based permission gate:
        - Students are blocked (403).
        - Each role can only use audience values in ROLE_AUDIENCE_PERMISSIONS.

        Recipient assignment is computed server-side — the frontend only sends the
        targeting rule, not a list of user IDs.
        """
        user = request.user

        # --- Permission gate ---
        if user.role == "student":
            return Response(
                {"error": "Students are not permitted to create notifications."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- Extract and validate inputs ---
        title = request.data.get("title", "").strip()
        message = request.data.get("message", "").strip()
        category = request.data.get("category", "general")
        target_audience = request.data.get("target_audience", "all_students")

        if not title:
            return Response({"error": "title is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({"error": "message is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate category
        valid_categories = {c[0] for c in Notification._meta.get_field("category").choices}
        if category not in valid_categories:
            return Response(
                {"error": f"Invalid category '{category}'. Valid: {sorted(valid_categories)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate target_audience against role permissions
        allowed_audiences = ROLE_AUDIENCE_PERMISSIONS.get(user.role, set())
        if target_audience not in allowed_audiences:
            return Response(
                {
                    "error": (
                        f"Your role '{user.role}' is not allowed to target '{target_audience}'."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Parse optional department/year lists
        # Use getlist() if available to properly handle multi-select FormData
        if hasattr(request.data, "getlist"):
            raw_departments = request.data.getlist("target_departments")
            raw_years = request.data.getlist("target_academic_years")
        else:
            raw_departments = request.data.get("target_departments", "")
            raw_years = request.data.get("target_academic_years", "")

        # Flatten list if elements are comma-separated strings inside a list, or just a string
        if isinstance(raw_departments, list):
            departments = [d.strip() for raw in raw_departments for d in raw.split(",") if d.strip()]
        else:
            departments = [d.strip() for d in raw_departments.split(",") if d.strip()]

        if isinstance(raw_years, list):
            academic_years = [y.strip() for raw in raw_years for y in raw.split(",") if y.strip()]
        else:
            academic_years = [y.strip() for y in raw_years.split(",") if y.strip()]

        # --- Department Authorization Override ---
        dept_scoped_roles = {"faculty", "department_coordinator"}
        if user.role in dept_scoped_roles:
            resp = FacultyResponsibility.objects.filter(user=user).first()
            if not resp or not resp.department:
                return Response(
                    {"error": "You do not have an assigned department to create notifications for."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Securely override any frontend values to match the coordinator's department exclusively
            departments = [resp.department]


        # --- Create notification ---
        try:
            notification = Notification.objects.create(
                title=title,
                message=message,
                category=category,
                target_audience=target_audience,
                target_departments=departments,
                target_academic_years=academic_years,
                creator=user,
                files=request.FILES.get("files", None),
            )

            # Resolve recipients server-side
            recipient_users = _resolve_recipients(
                target_audience, departments, academic_years, user
            )
            recipient_list = list(recipient_users)
            logger.info(
                "Notification %s created by %s — %d recipients resolved for audience '%s'",
                notification.id,
                user.email,
                len(recipient_list),
                target_audience,
            )

            # Always include the creator so they can see their own notification
            recipient_set = set(recipient_list)
            recipient_set.add(user)
            final_recipient_list = list(recipient_set)

            if final_recipient_list:
                notification.recipients.set(final_recipient_list)
                
                # Push real-time WebSocket notification to all recipients
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    for recipient in final_recipient_list:
                        group_name = f"user_{recipient.id}_notifications"
                        try:
                            async_to_sync(channel_layer.group_send)(
                                group_name,
                                {
                                    "type": "new_notification",
                                    "message": f"New notification: {title}"
                                }
                            )
                        except Exception as e:
                            logger.error(f"Failed to send websocket notification: {e}")
            else:
                logger.warning(
                    "No recipients resolved for notification %s (audience=%s, depts=%s, years=%s)",
                    notification.id,
                    target_audience,
                    departments,
                    academic_years,
                )

            serializer = self.get_serializer(notification)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as exc:
            logger.exception("Error creating notification: %s", exc)
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class NotificationDetail(generics.RetrieveAPIView):
    """
    Retrieve a single notification.

    Only accessible if the requesting user is a recipient.
    Automatically marks the notification as read on retrieval.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects.filter(recipients=self.request.user)
            .select_related("creator")
            .prefetch_related("read_by")
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Mark as read (idempotent — unique_together prevents duplicates)
        NotificationRead.objects.get_or_create(
            notification=instance,
            user=request.user,
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class NotificationMarkRead(APIView):
    """
    PATCH /api/notifications/<pk>/mark-read/

    Idempotent endpoint to mark a notification as read for the requesting user.
    Returns 200 regardless of whether it was already read.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipients=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found or you are not a recipient."},
                status=status.HTTP_404_NOT_FOUND,
            )

        NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user,
        )
        return Response({"status": "marked_read"}, status=status.HTTP_200_OK)


class NotificationUnreadCount(APIView):
    """
    GET /api/notifications/unread-count/

    Returns the number of unread notifications for the requesting user.
    Useful for badge counters in nav bars.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        total = Notification.objects.filter(recipients=user).count()
        read_count = NotificationRead.objects.filter(
            user=user,
            notification__recipients=user,
        ).count()
        unread = total - read_count
        return Response({"unread_count": unread}, status=status.HTTP_200_OK)