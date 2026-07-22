"""
Smoke tests for the notifications module.

Run with:
    python manage.py test notifications -v 2
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import Notification, NotificationRead
from student.models import Student
from base.models import FacultyResponsibility

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(email, role, password="testpass123", **kwargs):
    return User.objects.create_user(email=email, password=password, role=role, **kwargs)


def make_student(user, department="IT", academic_year="TE"):
    return Student.objects.create(
        user=user,
        uid=f"uid_{user.pk}",
        department=department,
        academic_year=academic_year,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class NotificationCreatePermissionTests(TestCase):
    """Role-based permission gates on POST /api/notifications/."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = make_user("student@test.com", "student", full_name="Test Student")
        self.student = make_student(self.student_user)
        self.staff_user = make_user("staff@test.com", "staff", full_name="Test Staff")

    def test_student_cannot_create_notification(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.post(
            "/api/notifications/",
            {
                "title": "Test",
                "message": "Hello",
                "category": "general",
                "target_audience": "all_students",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", res.data)

    def test_unauthenticated_cannot_create_notification(self):
        res = self.client.post(
            "/api/notifications/",
            {"title": "Test", "message": "Hello"},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_notification(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post(
            "/api/notifications/",
            {
                "title": "Staff Notice",
                "message": "Important update",
                "category": "general",
                "target_audience": "all_students",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Staff Notice")


class NotificationRecipientTests(TestCase):
    """Verify recipient assignment logic for various audience targets."""

    def setUp(self):
        self.client = APIClient()
        self.staff_user = make_user("staff@test.com", "staff", full_name="Staff User")

        self.it_student_user = make_user("it_student@test.com", "student", full_name="IT Student")
        self.it_student = make_student(self.it_student_user, department="IT", academic_year="TE")

        self.comp_student_user = make_user("comp_student@test.com", "student", full_name="COMP Student")
        self.comp_student = make_student(self.comp_student_user, department="COMP", academic_year="BE")

    def test_all_students_targeting_adds_all_student_users(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post(
            "/api/notifications/",
            {
                "title": "All Students Notice",
                "message": "For everyone",
                "category": "general",
                "target_audience": "all_students",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(id=res.data["id"])
        recipient_ids = set(notification.recipients.values_list("id", flat=True))
        self.assertIn(self.it_student_user.id, recipient_ids)
        self.assertIn(self.comp_student_user.id, recipient_ids)

    def test_department_students_targeting_isolates_department(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post(
            "/api/notifications/",
            {
                "title": "IT Only",
                "message": "Only for IT",
                "category": "placement",
                "target_audience": "department_students",
                "target_departments": "IT",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(id=res.data["id"])
        recipient_ids = set(notification.recipients.values_list("id", flat=True))
        self.assertIn(self.it_student_user.id, recipient_ids)
        self.assertNotIn(self.comp_student_user.id, recipient_ids)


class NotificationListVisibilityTests(TestCase):
    """Verify GET /api/notifications/ only returns the user's own notifications."""

    def setUp(self):
        self.client = APIClient()
        self.staff_user = make_user("staff@test.com", "staff", full_name="Staff")
        self.it_student_user = make_user("it@test.com", "student", full_name="IT Student")
        self.it_student = make_student(self.it_student_user, department="IT")
        self.comp_student_user = make_user("comp@test.com", "student", full_name="COMP Student")
        self.comp_student = make_student(self.comp_student_user, department="COMP")

    def _create_notification_for_it(self):
        self.client.force_authenticate(user=self.staff_user)
        self.client.post(
            "/api/notifications/",
            {
                "title": "IT Notice",
                "message": "IT only",
                "category": "training",
                "target_audience": "department_students",
                "target_departments": "IT",
            },
        )

    def test_it_student_sees_it_notification(self):
        self._create_notification_for_it()
        self.client.force_authenticate(user=self.it_student_user)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["title"], "IT Notice")

    def test_comp_student_cannot_see_it_notification(self):
        self._create_notification_for_it()
        self.client.force_authenticate(user=self.comp_student_user)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_unauthenticated_cannot_list_notifications(self):
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class NotificationReadTests(TestCase):
    """Verify NotificationRead tracking."""

    def setUp(self):
        self.client = APIClient()
        self.staff_user = make_user("staff@test.com", "staff", full_name="Staff")
        self.student_user = make_user("student@test.com", "student", full_name="Student")
        self.student = make_student(self.student_user)

        # Create a notification for the student
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post(
            "/api/notifications/",
            {
                "title": "Read Test",
                "message": "Testing read status",
                "category": "general",
                "target_audience": "all_students",
            },
        )
        self.notification_id = res.data["id"]

    def test_notification_initially_unread(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/notifications/")
        self.assertFalse(res.data[0]["is_read"])

    def test_mark_read_endpoint_creates_record(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.patch(f"/api/notifications/{self.notification_id}/mark-read/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(
            NotificationRead.objects.filter(
                notification_id=self.notification_id,
                user=self.student_user,
            ).exists()
        )

    def test_mark_read_is_idempotent(self):
        self.client.force_authenticate(user=self.student_user)
        self.client.patch(f"/api/notifications/{self.notification_id}/mark-read/")
        res = self.client.patch(f"/api/notifications/{self.notification_id}/mark-read/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            NotificationRead.objects.filter(
                notification_id=self.notification_id,
                user=self.student_user,
            ).count(),
            1,
        )

    def test_notification_marked_read_on_detail_view(self):
        self.client.force_authenticate(user=self.student_user)
        self.client.get(f"/api/notifications/{self.notification_id}/")
        # The detail view marks it read server-side
        self.assertTrue(
            NotificationRead.objects.filter(
                notification_id=self.notification_id,
                user=self.student_user,
            ).exists()
        )


class NotificationCategoryFilterTests(TestCase):
    """Verify ?category= query param filtering."""

    def setUp(self):
        self.client = APIClient()
        self.staff_user = make_user("staff@test.com", "staff", full_name="Staff")
        self.student_user = make_user("student@test.com", "student", full_name="Student")
        self.student = make_student(self.student_user)

        for cat in ("general", "training", "placement"):
            self.client.force_authenticate(user=self.staff_user)
            self.client.post(
                "/api/notifications/",
                {
                    "title": f"{cat.capitalize()} Notice",
                    "message": "Test",
                    "category": cat,
                    "target_audience": "all_students",
                },
            )

    def test_filter_by_category_training(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/notifications/?category=training")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["category"], "training")

    def test_no_filter_returns_all(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)
