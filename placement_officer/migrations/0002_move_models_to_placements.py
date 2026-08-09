"""Remove CategoryRule from `placement_officer` state (T-19).

State-only; `placements` adopted the table in its 0001 with
`db_table = "placement_officer_categoryrule"`.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("placement_officer", "0001_initial"),
        ("placements", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterUniqueTogether(name="categoryrule", unique_together=set()),
                migrations.DeleteModel(name="CategoryRule"),
            ],
        ),
    ]
