"""Backfill legacy attendance into `SessionAttendance` (T-18).

    # 1. look, change nothing
    python manage.py backfill_attendance --dry-run

    # 2. only after reading the report
    python manage.py backfill_attendance

    # 3. then, separately, check the numbers
    python scripts/verify_attendance_migration.py

**Run this against a copy of the database first.** It is deliberately a
command rather than a data migration: `entrypoint.sh` runs `migrate` on every
container start, so a data migration would apply itself on the next deploy with
nobody reading the output. The whole point is that somebody reads the output.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from training.backfill import backfill


class Command(BaseCommand):
    help = "Copy the five legacy attendance models into training.SessionAttendance."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Roll back at the end. Produces the real report, writes nothing.",
        )
        parser.add_argument(
            "--allow-skips",
            action="store_true",
            help=(
                "Proceed even though rows were skipped. Without this the command "
                "refuses to commit, because a skipped row is a student whose "
                "attendance silently disappears."
            ),
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        try:
            with transaction.atomic():
                report = backfill()
                self.stdout.write(report.as_text())

                if dry_run:
                    raise _Rollback()

                if report.total_skipped and not options["allow_skips"]:
                    raise _Refused()
        except _Rollback:
            self.stdout.write(
                self.style.WARNING("\nDRY RUN — rolled back. Nothing was written.")
            )
            return
        except _Refused:
            raise CommandError(
                f"\nRefusing to commit: {report.total_skipped} rows would be skipped.\n"
                "Every skipped row is attendance that disappears. Fix the causes "
                "listed above, or re-run with --allow-skips if you have decided "
                "each one is acceptable and recorded why."
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nWritten: {report.attendance_created} attendance rows across "
                f"{report.sessions_created} sessions."
            )
        )
        self.stdout.write(
            "\nNow run:  python scripts/verify_attendance_migration.py\n"
            "The backfill reporting success is not evidence that it was correct."
        )


class _Rollback(Exception):
    """Internal: unwinds the dry-run transaction."""


class _Refused(Exception):
    """Internal: unwinds a run that would have dropped rows."""
