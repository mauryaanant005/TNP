from django.apps import AppConfig


class PlacementOfficerConfig(AppConfig):
    """Migration-only shell. See placement_officer/models.py."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "placement_officer"
    verbose_name = "placement_officer (migrations only — see placements/)"
