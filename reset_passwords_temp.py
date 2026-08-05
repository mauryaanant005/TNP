import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 't_and_p_automation.settings')
django.setup()

from base.models import User

DEFAULT_SEED_PASSWORD = os.getenv("DEFAULT_SEED_PASSWORD", "tcet@1234")

count = 0
for u in User.objects.all():
    u.set_password(DEFAULT_SEED_PASSWORD)
    u.save()
    count += 1

print(f"Updated {count} users.")
