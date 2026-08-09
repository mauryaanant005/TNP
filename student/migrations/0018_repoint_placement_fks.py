"""Repoint StudentOffer / StudentPlacementAppliedCompany at `placements` (T-19).

State-only, like the rest of the move. The target tables are the same physical
tables under the same names — only the app label Django records for them
changes — so there is no constraint to drop and nothing to rebuild.

Without this, `staff`'s models cannot be removed from state: Django refuses to
delete a model that other models still reference.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("student", "0017_alter_resume_profile_image"),
        ("placements", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="studentoffer",
                    name="company",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="company_offers",
                        to="placements.companyregistration",
                    ),
                ),
                migrations.AlterField(
                    model_name="studentoffer",
                    name="job_offer",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="student_offers",
                        to="placements.joboffer",
                    ),
                ),
                migrations.AlterField(
                    model_name="studentplacementappliedcompany",
                    name="company",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="company",
                        to="placements.companyregistration",
                    ),
                ),
                migrations.AlterField(
                    model_name="studentplacementappliedcompany",
                    name="job_offer",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="offer",
                        to="placements.joboffer",
                    ),
                ),
            ],
        ),
    ]
