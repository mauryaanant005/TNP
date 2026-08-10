import random
from datetime import date
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from internship_api.models import InternshipAcceptance
from program_coordinator_api.models import (
    AttendanceData,
    TrainingPerformance,
    TrainingPerformanceCategory,
)
from student.models import Student


class Command(BaseCommand):
    help = "Seed or purge synthetic activity data (AttendanceData, TrainingPerformance, InternshipAcceptance)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batches",
            nargs="+",
            default=["2026", "2027", "2028"],
            help="Batches to seed synthetic activity data for",
        )
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Purge synthetic activity data",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Bypass DEV environment check",
        )

    def handle(self, *args, **options):
        env = getattr(settings, "ENV", None) or getattr(settings, "ENVIRONMENT", "DEV")
        if str(env).upper() != "DEV" and not options["force"]:
            raise CommandError(
                "seed_synthetic_activity can only be run in DEV environment unless --force is supplied."
            )

        if options["purge"]:
            att_deleted, _ = AttendanceData.objects.filter(
                session__startswith="SYNTH-"
            ).delete()
            perf_deleted, _ = TrainingPerformance.objects.filter(
                training_type__endswith="(synthetic)"
            ).delete()
            intern_deleted, _ = InternshipAcceptance.objects.filter(
                company_name__startswith="[SYNTHETIC]"
            ).delete()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Purged synthetic data: {att_deleted} attendance rows, "
                    f"{perf_deleted} training performance rows, {intern_deleted} internship acceptances."
                )
            )
            return

        batches = options["batches"]
        students = Student.objects.filter(batch__in=batches).select_related("user")
        if not students.exists():
            self.stdout.write(
                self.style.WARNING(f"No students found for batches: {', '.join(batches)}")
            )
            return

        self.stdout.write(
            f"Seeding synthetic activity for {students.count()} students across batches {', '.join(batches)}..."
        )

        random.seed(42)  # Deterministic seed

        att_objs = []
        cat_objs = []
        intern_objs = []

        now = timezone.now()
        start_d = date(2025, 6, 1)
        comp_d = date(2025, 6, 30)
        perf_count = 0

        with transaction.atomic():
            for student in students:
                # 1. AttendanceData
                for s_idx in [1, 2]:
                    is_present = "Present" if random.random() > 0.15 else "Absent"
                    att_objs.append(
                        AttendanceData(
                            batch=student.batch,
                            late="" if is_present == "Present" else "Late",
                            name=student.user.full_name if student.user else student.uid,
                            present=is_present,
                            program_name="ACT_TECHNICAL" if s_idx == 1 else "ACT_APTITUDE",
                            session=f"SYNTH-Session {s_idx}",
                            timestamp=now,
                            uid=student.uid,
                            year=student.batch,
                            semester="SEMESTER 6",
                        )
                    )

                # 2. TrainingPerformance & Categories
                for t_type in ["Technical (synthetic)", "Aptitude (synthetic)"]:
                    tp = TrainingPerformance.objects.create(
                        student=student,
                        training_type=t_type,
                        semester="SEMESTER 6",
                        date=date(2025, 3, 15),
                    )
                    perf_count += 1
                    cat_objs.append(
                        TrainingPerformanceCategory(
                            performance=tp,
                            category_name="Module Assessment 1",
                            marks=round(random.uniform(65.0, 95.0), 2),
                        )
                    )
                    cat_objs.append(
                        TrainingPerformanceCategory(
                            performance=tp,
                            category_name="Module Assessment 2",
                            marks=round(random.uniform(60.0, 90.0), 2),
                        )
                    )

                # 3. InternshipAcceptance (~35% of students)
                if random.random() < 0.35:
                    intern_objs.append(
                        InternshipAcceptance(
                            student=student,
                            year=student.batch,
                            company_name=f"[SYNTHETIC] Tech Corp {random.randint(1, 5)}",
                            offer_letter="offer_letters/synthetic_offer.pdf",
                            type="Part-time",
                            salary=float(random.randint(10000, 35000)),
                            is_verified=False,
                            domain_name="synthetic",
                            total_hours=120,
                            start_date=start_d,
                            completion_date=comp_d,
                            offer_type="in_house",
                        )
                    )

            AttendanceData.objects.bulk_create(att_objs, batch_size=1000)
            TrainingPerformanceCategory.objects.bulk_create(cat_objs, batch_size=1000)
            InternshipAcceptance.objects.bulk_create(intern_objs, batch_size=1000)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded: {len(att_objs)} AttendanceData rows, "
                f"{perf_count} TrainingPerformance rows, {len(intern_objs)} InternshipAcceptance rows."
            )
        )
