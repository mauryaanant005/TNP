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
from student.models import (
    PlacementCompanyProgress,
    Student,
    StudentOffer,
    StudentPlacementAppliedCompany,
)

# Marker for the derived application rows. `not_interested_reason` is a
# non-null TextField that is meaningless for an accepted application, which
# makes it the natural place to record provenance.
APPLICATION_MARKER = "[DERIVED] reconstructed from an imported placement offer"


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
            # Progress rows hang off the application by a CASCADE OneToOne, so
            # deleting the applications takes them with it.
            app_deleted, _ = StudentPlacementAppliedCompany.objects.filter(
                not_interested_reason=APPLICATION_MARKER
            ).delete()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Purged synthetic data: {att_deleted} attendance rows, "
                    f"{perf_deleted} training performance rows, "
                    f"{intern_deleted} internship acceptances, "
                    f"{app_deleted} derived applications."
                )
            )
            return

        batches = options["batches"]

        # Seeding is not idempotent — every run appends another set of sessions,
        # marks and internships, quietly doubling every average on the
        # dashboards. Refuse rather than corrupt the numbers.
        existing = AttendanceData.objects.filter(
            session__startswith="SYNTH-", batch__in=batches
        ).count()
        if existing:
            raise CommandError(
                f"{existing} synthetic attendance rows already exist for "
                f"batches {', '.join(batches)}. Run with --purge first, or this "
                f"run would double every attendance and performance average."
            )

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
                            # `jobs/reports/` and `jobs/download-report/` only
                            # ever return verified internships, so leaving every
                            # row unverified makes the internship report render
                            # empty — the exact "No Data Found" this seeding
                            # exists to remove. Two thirds verified also leaves
                            # the verification queue non-empty to click through.
                            is_verified=random.random() < 0.67,
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

            app_count, progress_count = self._derive_applications(batches)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded: {len(att_objs)} AttendanceData rows, "
                f"{perf_count} TrainingPerformance rows, {len(intern_objs)} InternshipAcceptance rows, "
                f"{app_count} derived applications, {progress_count} progress rows."
            )
        )

    def _derive_applications(self, batches):
        """Reconstruct applications and round progress from imported offers.

        The Consolidated Report (`get_data_by_year`) and the Branch-wise
        report's stage counts are built on `StudentPlacementAppliedCompany` and
        `PlacementCompanyProgress`. The placement registers record *outcomes*
        only — who was hired, by whom, for how much — so both tables stay empty
        after an import and both reports render blank.

        This is inference rather than invention: a student holding an offer from
        a company necessarily applied to it and cleared its rounds. Nothing is
        created for a student who has no offer, which is why every department
        reads applied == selected. That is a limitation of the source, and it
        is better than a blank page or a fabricated applicant pool.
        """
        offers = (
            StudentOffer.objects.filter(student__batch__in=batches)
            .select_related("student", "company")
        )
        existing = set(
            StudentPlacementAppliedCompany.objects.values_list(
                "student_id", "company_id"
            )
        )

        applications = []
        for offer in offers:
            key = (offer.student_id, offer.company_id)
            if key in existing:
                continue
            existing.add(key)
            applications.append(
                StudentPlacementAppliedCompany(
                    student=offer.student,
                    company=offer.company,
                    # `consolidation_report` counts the `applied_*` columns
                    # through this FK (`related_name="offer"`), not through the
                    # company — leaving it null renders every applied count as
                    # 0 while the selected counts populate.
                    job_offer=offer.job_offer,
                    interested=True,
                    not_interested_reason=APPLICATION_MARKER,
                )
            )

        StudentPlacementAppliedCompany.objects.bulk_create(applications, batch_size=1000)

        progress = [
            PlacementCompanyProgress(
                application=application,
                registered=True,
                aptitude_test=True,
                coding_test=True,
                technical_interview=True,
                hr_interview=True,
                gd=True,
                final_result="Selected",
            )
            for application in applications
        ]
        PlacementCompanyProgress.objects.bulk_create(progress, batch_size=1000)
        return len(applications), len(progress)
