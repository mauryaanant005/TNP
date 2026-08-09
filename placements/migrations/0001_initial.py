"""Move Notice / CompanyRegistration / JobOffer / CategoryRule into `placements`.

**No DDL. Not one row moves, not one table is touched.**

Every operation is wrapped in `SeparateDatabaseAndState` with an empty
`database_operations`, so Django updates only its own idea of where these
models live. The tables keep the names they already have
(`staff_companyregistration`, `placement_officer_categoryrule`, …) because
`Meta.db_table` pins them — see the note in `placements/models.py`.

Ordering across the three migrations that make up this move:

    placements.0001          create the models in state
    student.00XX             repoint the FKs at placements (also state-only)
    staff.00XX               delete the old models from state
    placement_officer.00XX   same

Reversing is symmetrical and equally harmless.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        # The old apps must exist in state before their models can be adopted.
        ("staff", "0001_initial"),
        ("placement_officer", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="Notice",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("subject", models.CharField(max_length=255)),
                        ("date", models.DateField()),
                        ("intro", models.TextField()),
                        ("about", models.TextField()),
                        ("company_registration_link", models.URLField()),
                        ("note", models.TextField(blank=True, null=True)),
                        ("location", models.CharField(max_length=255)),
                        ("deadline", models.DateField()),
                    ],
                    options={"db_table": "staff_notice"},
                ),
                migrations.CreateModel(
                    name="CompanyRegistration",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("name", models.CharField(max_length=255)),
                        ("batch", models.CharField(max_length=50)),
                        ("min_tenth_marks", models.CharField(max_length=10)),
                        ("min_higher_secondary_marks", models.CharField(max_length=10)),
                        ("min_cgpa", models.CharField(max_length=10)),
                        ("accepted_kt", models.BooleanField(default=False)),
                        ("domain", models.CharField(max_length=100)),
                        ("departments", models.CharField(max_length=255)),
                        ("is_aedp_or_pli", models.BooleanField(default=False)),
                        ("is_aedp_or_ojt", models.BooleanField(default=False)),
                        ("selected_departments", models.JSONField(default=list)),
                        (
                            "notice",
                            models.OneToOneField(
                                on_delete=django.db.models.deletion.CASCADE,
                                to="placements.notice",
                            ),
                        ),
                    ],
                    options={"db_table": "staff_companyregistration"},
                ),
                migrations.CreateModel(
                    name="JobOffer",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("role", models.CharField(max_length=255)),
                        ("salary", models.CharField(max_length=50)),
                        ("skills", models.TextField()),
                        (
                            "form",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="job_offers",
                                to="placements.companyregistration",
                            ),
                        ),
                    ],
                    options={"db_table": "staff_joboffer"},
                ),
                migrations.AddConstraint(
                    model_name="companyregistration",
                    constraint=models.UniqueConstraint(
                        fields=("name", "batch"), name="unique_name_batch"
                    ),
                ),
                migrations.CreateModel(
                    name="CategoryRule",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        (
                            "category",
                            models.CharField(
                                choices=[
                                    ("Category_1", "Category 1"),
                                    ("Category_2", "Category 2"),
                                    ("Category_3", "Category 3"),
                                    ("Category_4", "Category 4"),
                                ],
                                max_length=20,
                            ),
                        ),
                        ("batch", models.CharField(max_length=50)),
                        ("minimum_academic_attendance", models.FloatField(blank=True, null=True)),
                        ("minimum_academic_performance", models.FloatField(blank=True, null=True)),
                        ("minimum_training_attendance", models.FloatField(blank=True, null=True)),
                        ("minimum_training_performance", models.FloatField(blank=True, null=True)),
                    ],
                    options={
                        "db_table": "placement_officer_categoryrule",
                        "ordering": ["category"],
                        "unique_together": {("category", "batch")},
                    },
                ),
            ],
        ),
    ]
