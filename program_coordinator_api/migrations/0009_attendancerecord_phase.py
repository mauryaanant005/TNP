from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('program_coordinator_api', '0008_alter_attendancedata_late_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendancerecord',
            name='phase',
            field=models.CharField(choices=[('Phase 1', 'Phase 1'), ('Phase 2', 'Phase 2'), ('Phase 3', 'Phase 3')], default='Phase 1', max_length=100),
        ),
    ]