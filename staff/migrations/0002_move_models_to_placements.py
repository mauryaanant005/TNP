"""Remove the models from `staff` state — they live in `placements` now (T-19).

State-only. The tables are untouched; `placements` adopted them in its 0001
with matching `db_table` values.

This runs last of the four, because both `placements.0001` (which adopts them)
and `student.0018` (which repoints the FKs) must be in state first.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0001_initial"),
        ("placements", "0001_initial"),
        ("student", "0018_repoint_placement_fks"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                # Order matters: JobOffer and CompanyRegistration reference the
                # models below them.
                migrations.RemoveConstraint(
                    model_name="companyregistration", name="unique_name_batch"
                ),
                migrations.DeleteModel(name="JobOffer"),
                migrations.DeleteModel(name="CompanyRegistration"),
                migrations.DeleteModel(name="Notice"),
            ],
        ),
    ]
