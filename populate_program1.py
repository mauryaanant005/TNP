import os
import django
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "t_and_p_automation.settings")
django.setup()

from program_coordinator_api.models import Program1

def run():
    print("Deleting existing Program1 data...")
    Program1.objects.all().delete()

    print("Generating dummy data for Program1...")
    branches = ["COMP_A", "COMP_B", "IT_A", "AI&DS_A"]
    years = [2023, 2024]
    programs = ["ACT_APTITUDE", "TECHNICAL"]

    for _ in range(50):
        Program1.objects.create(
            UID=f"20-{random.randint(100, 999)}",
            Name=f"Student {random.randint(1, 100)}",
            Branch_Div=random.choice(branches),
            Year=random.choice(years),
            training_attendance=random.uniform(50.0, 100.0),
            training_performance=random.uniform(40.0, 100.0),
            semester=random.choice(["Semester 1", "Semester 2"]),
            program_name=random.choice(programs)
        )
    print("Done! Populated 50 dummy records in Program1.")

if __name__ == "__main__":
    run()
