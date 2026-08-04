import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 't_and_p_automation.settings')
django.setup()

from base.models import User
from student.models import Student

print("Deleting all Student records...")
deleted_students, _ = Student.objects.all().delete()
print(f"Deleted {deleted_students} Student records.")

print("Deleting all User records with role='student'...")
deleted_users, _ = User.objects.filter(role='student').delete()
print(f"Deleted {deleted_users} User records.")

print("Deletion complete.")
