"""Seed the reference tables from existing free-text data (T-17).

    python manage.py seed_institution --dry-run     # look first
    python manage.py seed_institution

Read the report. Near-duplicate codes are the finding, not noise - they are
real typos in the data, and merging them is a decision only a human can make.
Do that before T-24 turns those columns into foreign keys.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from institution.services import seed_from_existing_data


class Command(BaseCommand):
    help = "Populate institution reference tables from existing free-text columns."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Roll back at the end. Prints the same report, writes nothing.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if dry_run:
            # Nested atomic + explicit rollback, so the report is produced from
            # real inserts rather than a guess about what would happen.
            try:
                with transaction.atomic():
                    report = seed_from_existing_data()
                    self.stdout.write(report.as_text())
                    raise _Rollback()
            except _Rollback:
                self.stdout.write(self.style.WARNING("\nDRY RUN - rolled back, nothing written."))
            return

        report = seed_from_existing_data()
        self.stdout.write(report.as_text())
        if report.suspicious:
            self.stdout.write(
                self.style.WARNING(
                    "\nPossible duplicates listed above. Merge them before T-24."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("\nSeeded."))


class _Rollback(Exception):
    """Internal: unwinds the dry-run transaction."""
