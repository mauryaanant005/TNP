import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from base.models import User
from student.models import Student, AcademicAttendanceSemester
from program_coordinator_api.models import (
    AttendanceData,
    BatchAttendance,
    Program1,
    TrainingPerformance,
    TrainingPerformanceCategory,
)

# Exact 25 Master Students Dataset matching Technical, Aptitude, Coding & Internship dummy files
MASTER_STUDENTS = [
    {
        "uid": "24-IT-A01-28",
        "name": "Aarav Sharma",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 9.42,
        "base_attendance": 92.5,
        "is_kt": False,
        "tech_perf": 91.0,
        "apt_perf": 90.8,
        "coding_perf": 96.0,
    },
    {
        "uid": "24-IT-A02-28",
        "name": "Ananya Patel",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 8.85,
        "base_attendance": 88.0,
        "is_kt": False,
        "tech_perf": 86.2,
        "apt_perf": 85.4,
        "coding_perf": 88.0,
    },
    {
        "uid": "24-IT-A03-28",
        "name": "Rohan Gupta",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.65,
        "base_attendance": 78.5,
        "is_kt": False,
        "tech_perf": 73.4,
        "apt_perf": 74.0,
        "coding_perf": 75.0,
    },
    {
        "uid": "24-IT-A04-28",
        "name": "Priya Verma",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.90,
        "base_attendance": 81.0,
        "is_kt": False,
        "tech_perf": 79.0,
        "apt_perf": 79.4,
        "coding_perf": 80.0,
    },
    {
        "uid": "24-IT-B05-28",
        "name": "Siddharth Iyer",
        "branch": "IT-B",
        "dept": "IT",
        "div": "B",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 9.15,
        "base_attendance": 90.0,
        "is_kt": False,
        "tech_perf": 90.8,
        "apt_perf": 91.2,
        "coding_perf": 94.0,
    },
    {
        "uid": "24-IT-B06-28",
        "name": "Neha Joshi",
        "branch": "IT-B",
        "dept": "IT",
        "div": "B",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 6.20,
        "base_attendance": 68.0,
        "is_kt": True,
        "tech_perf": 55.8,
        "apt_perf": 57.6,
        "coding_perf": 54.0,
    },
    {
        "uid": "23-IT-A07-27",
        "name": "Aditya Deshmukh",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 8.70,
        "base_attendance": 85.5,
        "is_kt": False,
        "tech_perf": 86.4,
        "apt_perf": 84.6,
        "coding_perf": 86.0,
    },
    {
        "uid": "23-IT-A08-27",
        "name": "Tanvi Kulkarni",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 7.45,
        "base_attendance": 76.0,
        "is_kt": False,
        "tech_perf": 71.8,
        "apt_perf": 73.0,
        "coding_perf": 72.0,
    },
    {
        "uid": "23-IT-B09-27",
        "name": "Yash Mehta",
        "branch": "IT-B",
        "dept": "IT",
        "div": "B",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 7.80,
        "base_attendance": 80.0,
        "is_kt": False,
        "tech_perf": 78.0,
        "apt_perf": 77.2,
        "coding_perf": 78.0,
    },
    {
        "uid": "22-IT-A10-26",
        "name": "Sneha Nair",
        "branch": "IT-A",
        "dept": "IT",
        "div": "A",
        "batch": "2026",
        "academic_year": "BE",
        "semester": "Semester 8",
        "cgpa": 9.30,
        "base_attendance": 94.0,
        "is_kt": False,
        "tech_perf": 93.4,
        "apt_perf": 92.6,
        "coding_perf": 95.0,
    },
    {
        "uid": "24-CMPNA01-28",
        "name": "Vihaan Jain",
        "branch": "CMPN-A",
        "dept": "CMPN",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 9.05,
        "base_attendance": 89.0,
        "is_kt": False,
        "tech_perf": 89.8,
        "apt_perf": 88.8,
        "coding_perf": 93.0,
    },
    {
        "uid": "24-CMPNA02-28",
        "name": "Ishita Roy",
        "branch": "CMPN-A",
        "dept": "CMPN",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.55,
        "base_attendance": 77.0,
        "is_kt": False,
        "tech_perf": 74.8,
        "apt_perf": 75.6,
        "coding_perf": 76.0,
    },
    {
        "uid": "24-CMPNB03-28",
        "name": "Manav Shah",
        "branch": "CMPN-B",
        "dept": "CMPN",
        "div": "B",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.10,
        "base_attendance": 74.5,
        "is_kt": False,
        "tech_perf": 69.4,
        "apt_perf": 70.4,
        "coding_perf": 70.0,
    },
    {
        "uid": "23-CMPNA04-27",
        "name": "Diya Kapoor",
        "branch": "CMPN-A",
        "dept": "CMPN",
        "div": "A",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 8.60,
        "base_attendance": 86.0,
        "is_kt": False,
        "tech_perf": 85.0,
        "apt_perf": 84.6,
        "coding_perf": 87.0,
    },
    {
        "uid": "22-COMPA05-26",
        "name": "Aniket Patel",
        "branch": "COMP-A",
        "dept": "COMP",
        "div": "A",
        "batch": "2026",
        "academic_year": "BE",
        "semester": "Semester 8",
        "cgpa": 7.85,
        "base_attendance": 82.0,
        "is_kt": False,
        "tech_perf": 80.6,
        "apt_perf": 79.8,
        "coding_perf": 82.0,
    },
    {
        "uid": "24-AI&DSA01-28",
        "name": "Kabir Malhotra",
        "branch": "AI&DS-A",
        "dept": "AI&DS",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 9.25,
        "base_attendance": 91.5,
        "is_kt": False,
        "tech_perf": 93.0,
        "apt_perf": 93.0,
        "coding_perf": 97.0,
    },
    {
        "uid": "24-AI&DSA02-28",
        "name": "Riya Sengupta",
        "branch": "AI&DS-A",
        "dept": "AI&DS",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.70,
        "base_attendance": 79.0,
        "is_kt": False,
        "tech_perf": 76.4,
        "apt_perf": 77.4,
        "coding_perf": 78.0,
    },
    {
        "uid": "24-AI&DSB03-28",
        "name": "Aryan Chopda",
        "branch": "AI&DS-B",
        "dept": "AI&DS",
        "div": "B",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 5.90,
        "base_attendance": 65.0,
        "is_kt": True,
        "tech_perf": 51.8,
        "apt_perf": 53.6,
        "coding_perf": 50.0,
    },
    {
        "uid": "23-AI&DSA04-27",
        "name": "Kritika Saxena",
        "branch": "AI&DS-A",
        "dept": "AI&DS",
        "div": "A",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 8.90,
        "base_attendance": 87.5,
        "is_kt": False,
        "tech_perf": 88.0,
        "apt_perf": 87.4,
        "coding_perf": 90.0,
    },
    {
        "uid": "24-AIMLA01-28",
        "name": "Devansh Trivedi",
        "branch": "AI&ML-A",
        "dept": "AI&ML",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 8.95,
        "base_attendance": 88.5,
        "is_kt": False,
        "tech_perf": 89.0,
        "apt_perf": 89.0,
        "coding_perf": 92.0,
    },
    {
        "uid": "24-AIMLA02-28",
        "name": "Meera Nambiar",
        "branch": "AI&ML-A",
        "dept": "AI&ML",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.35,
        "base_attendance": 75.5,
        "is_kt": False,
        "tech_perf": 72.4,
        "apt_perf": 74.2,
        "coding_perf": 74.0,
    },
    {
        "uid": "24-EXTCA01-28",
        "name": "Harshit Agarwal",
        "branch": "EXTC-A",
        "dept": "EXTC",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.40,
        "base_attendance": 76.5,
        "is_kt": False,
        "tech_perf": 71.4,
        "apt_perf": 75.6,
        "coding_perf": 71.0,
    },
    {
        "uid": "23-EXTCA02-27",
        "name": "Pooja Bhatt",
        "branch": "EXTC-A",
        "dept": "EXTC",
        "div": "A",
        "batch": "2027",
        "academic_year": "BE",
        "semester": "Semester 7",
        "cgpa": 6.45,
        "base_attendance": 69.5,
        "is_kt": True,
        "tech_perf": 57.8,
        "apt_perf": 60.0,
        "coding_perf": 56.0,
    },
    {
        "uid": "24-MECHA01-28",
        "name": "Varun Patil",
        "branch": "MECH-A",
        "dept": "MECH",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 7.25,
        "base_attendance": 77.0,
        "is_kt": False,
        "tech_perf": 65.0,
        "apt_perf": 75.2,
        "coding_perf": 65.0,
    },
    {
        "uid": "24-MECHA02-28",
        "name": "Shruti Gaikwad",
        "branch": "MECH-A",
        "dept": "MECH",
        "div": "A",
        "batch": "2028",
        "academic_year": "TE",
        "semester": "Semester 5",
        "cgpa": 5.80,
        "base_attendance": 64.0,
        "is_kt": True,
        "tech_perf": 48.4,
        "apt_perf": 54.8,
        "coding_perf": 48.0,
    },
]

PROGRAM_CONFIGS = [
    {"name": "ACT Technical", "sessions": 10, "start_date": datetime.date(2025, 7, 5)},
    {"name": "ACT Aptitude", "sessions": 8, "start_date": datetime.date(2025, 7, 20)},
    {"name": "SDP", "sessions": 6, "start_date": datetime.date(2025, 8, 10)},
    {"name": "Coding Contest", "sessions": 5, "start_date": datetime.date(2025, 8, 25)},
]


class Command(BaseCommand):
    help = "Seed realistic training attendance and performance records for the master student cohort."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing dummy attendance data before seeding",
        )

    def handle(self, *args, **options):
        self.stdout.write("Seeding Training Attendance Data for Master Students...")

        now = timezone.now()
        admin_user, _ = User.objects.get_or_create(
            email="admin@tcetmumbai.in",
            defaults={"full_name": "System Admin", "role": "system_admin", "is_staff": True},
        )

        with transaction.atomic():
            if options.get("clear"):
                uids = [s["uid"] for s in MASTER_STUDENTS]
                AttendanceData.objects.filter(uid__in=uids).delete()
                Program1.objects.filter(UID__in=uids).delete()
                BatchAttendance.objects.filter(batch__in=["2026", "2027", "2028"]).delete()

            student_objs = {}
            for s_data in MASTER_STUDENTS:
                email = f"{s_data['uid'].lower().replace('&', '').replace('-', '.')}@tcetmumbai.in"
                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={"full_name": s_data["name"], "role": "student"},
                )
                user.set_password("tcet@1234")
                user.save()

                student, _ = Student.objects.update_or_create(
                    uid=s_data["uid"],
                    defaults={
                        "user": user,
                        "department": s_data["dept"],
                        "division": s_data["div"],
                        "batch": s_data["batch"],
                        "academic_year": s_data["academic_year"],
                        "cgpa": s_data["cgpa"],
                        "attendance": s_data["base_attendance"],
                        "is_kt": s_data["is_kt"],
                    },
                )
                student_objs[s_data["uid"]] = student

                # Set academic attendance
                AcademicAttendanceSemester.objects.update_or_create(
                    student=student,
                    semester=s_data["semester"],
                    defaults={"attendance": s_data["base_attendance"]},
                )

            # Generate AttendanceData & Program1
            attendance_records = []
            program1_records = []

            for prog in PROGRAM_CONFIGS:
                prog_name = prog["name"]
                num_sessions = prog["sessions"]

                for s_data in MASTER_STUDENTS:
                    base_att = s_data["base_attendance"]
                    # Calculate target number of present sessions based on student profile
                    target_present = round((base_att / 100.0) * num_sessions)
                    target_present = max(1, min(num_sessions, target_present))

                    # Deterministic hash for session attendance status
                    for sess_idx in range(1, num_sessions + 1):
                        sess_name = f"Session {sess_idx}"
                        # Deterministic distribution of absences
                        seed_hash = (hash(s_data["uid"]) + sess_idx * 7 + num_sessions * 13) % num_sessions
                        is_present = "Present" if seed_hash < target_present else "Absent"

                        # Realistic Late tagging (only on ~8-12% of present sessions)
                        is_late = "Late" if (is_present == "Present" and (seed_hash % 6 == 0)) else "Not Late"

                        att_row = AttendanceData(
                            batch=s_data["batch"],
                            late=is_late,
                            name=s_data["name"],
                            present=is_present,
                            program_name=prog_name,
                            session=sess_name,
                            timestamp=now,
                            uid=s_data["uid"],
                            year=s_data["batch"],
                            semester=s_data["semester"],
                        )
                        attendance_records.append(att_row)

                    # Training percentage for this program
                    prog_att_pct = round((target_present / float(num_sessions)) * 100.0, 1)
                    prog_perf = s_data["tech_perf"] if "Technical" in prog_name else (
                        s_data["apt_perf"] if "Aptitude" in prog_name else (
                            s_data["coding_perf"] if "Coding" in prog_name else 82.5
                        )
                    )

                    program1_records.append(
                        Program1(
                            UID=s_data["uid"],
                            Name=s_data["name"],
                            Branch_Div=s_data["branch"],
                            Year=int(s_data["batch"]),
                            training_attendance=prog_att_pct,
                            training_performance=prog_perf,
                            semester=s_data["semester"],
                            program_name=prog_name,
                        )
                    )

            # Bulk delete existing records for these exact students/programs before insertion
            uids = [s["uid"] for s in MASTER_STUDENTS]
            AttendanceData.objects.filter(uid__in=uids).delete()
            Program1.objects.filter(UID__in=uids).delete()

            AttendanceData.objects.bulk_create(attendance_records)
            Program1.objects.bulk_create(program1_records)

            # Recompute BatchAttendance summary table
            BatchAttendance.objects.filter(batch__in=["2026", "2027", "2028"]).delete()
            batch_agg_map = {}

            for att in attendance_records:
                key = (att.batch, att.program_name, att.year, att.session)
                if key not in batch_agg_map:
                    batch_agg_map[key] = {
                        "total_students": 0,
                        "total_present": 0,
                        "total_absent": 0,
                        "total_late": 0,
                    }
                batch_agg_map[key]["total_students"] += 1
                if att.present == "Present":
                    batch_agg_map[key]["total_present"] += 1
                else:
                    batch_agg_map[key]["total_absent"] += 1

                if att.late == "Late":
                    batch_agg_map[key]["total_late"] += 1

            batch_att_objs = [
                BatchAttendance(
                    batch=k[0],
                    program_name=k[1],
                    year=k[2],
                    session=k[3],
                    total_students=v["total_students"],
                    total_present=v["total_present"],
                    total_absent=v["total_absent"],
                    total_late=v["total_late"],
                )
                for k, v in batch_agg_map.items()
            ]
            BatchAttendance.objects.bulk_create(batch_att_objs)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {len(attendance_records)} session attendance records, "
                f"{len(program1_records)} Program1 performance records, and "
                f"{len(batch_att_objs)} batch attendance summary rows across 25 master students."
            )
        )
