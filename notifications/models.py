from django.core.validators import FileExtensionValidator
from django.db import models
from base.models import User
from base.upload_validators import validate_attachment_size

SAFE_ATTACHMENT_EXTENSIONS = [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "jpg", "jpeg", "png", "gif", "webp", "txt", "csv",
]


CATEGORY_CHOICES = [
    ("general", "General"),
    ("training", "Training"),
    ("placement", "Placement"),
    ("internship", "Internship"),
    ("resource", "Resource"),
]

TARGET_AUDIENCE_CHOICES = [
    ("all_students", "All Students"),
    ("all_faculty", "All Faculty"),
    ("all_staff", "All Staff"),
    ("all_placement_officers", "All Placement Officers"),
    ("all_training_officers", "All Training Officers"),
    ("all_internship_officers", "All Internship Officers"),
    ("department_students", "Department-specific Students"),
    ("year_students", "Year-specific Students"),
    ("department_faculty", "Department-specific Faculty"),
    ("all_users", "All Users"),
]


class Notification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_notifications"
    )
    recipients = models.ManyToManyField(User, related_name="received_notifications", blank=True)
    files = models.FileField(
        upload_to="notifications/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=SAFE_ATTACHMENT_EXTENSIONS),
            validate_attachment_size,
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Structured category (replaces the old loose type_notification field)
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="general",
        db_index=True,
    )

    # Audience targeting metadata — stored so the intent is queryable/auditable
    target_audience = models.CharField(
        max_length=50,
        choices=TARGET_AUDIENCE_CHOICES,
        default="all_students",
        db_index=True,
    )
    target_departments = models.JSONField(default=list, blank=True)
    target_academic_years = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.title


class NotificationRead(models.Model):
    """Tracks which users have read which notifications."""

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="read_by"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notification_reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notification", "user")

    def __str__(self):
        return f"{self.user.email} read '{self.notification.title}'"