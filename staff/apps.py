from django.apps import AppConfig


class StaffConfig(AppConfig):
    """Migration-only shell. See staff/models.py."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "staff"
    verbose_name = "staff (migrations only — see placements/)"
