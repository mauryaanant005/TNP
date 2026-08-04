import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 't_and_p_automation.settings')
django.setup()

from base.models import User

count = 0
for u in User.objects.all():
    u.set_password('tcet@1234')
    u.save()
    count += 1

print(f"Updated {count} users.")
