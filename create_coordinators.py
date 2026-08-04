import os
import django
import sys

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "t_and_p_automation.settings")
django.setup()

from base.models import User, FacultyResponsibility

# Department Coordinator
dept_user, created = User.objects.get_or_create(
    email="deptcoord@tcet.ac.in",
    defaults={
        "full_name": "Department Coordinator User",
        "role": "faculty",
    }
)
if created or not dept_user.check_password("tcet@1234"):
    dept_user.set_password("tcet@1234")
    dept_user.role = "faculty"
    dept_user.save()

# Ensure faculty responsibility exists for Department
FacultyResponsibility.objects.update_or_create(
    user=dept_user,
    defaults={
        "department": "COMP",
        "program": ""
    }
)

# Program Coordinator
prog_user, created = User.objects.get_or_create(
    email="progcoord@tcet.ac.in",
    defaults={
        "full_name": "Program Coordinator User",
        "role": "faculty",
    }
)
if created or not prog_user.check_password("tcet@1234"):
    prog_user.set_password("tcet@1234")
    prog_user.role = "faculty"
    prog_user.save()

# Ensure faculty responsibility exists for Program
FacultyResponsibility.objects.update_or_create(
    user=prog_user,
    defaults={
        "program": "ACT_TECHNICAL",
        "department": ""
    }
)

print("Sample coordinator accounts created/updated.")
print("Department Coordinator: deptcoord@tcet.ac.in / tcet@1234")
print("Program Coordinator: progcoord@tcet.ac.in / tcet@1234")
