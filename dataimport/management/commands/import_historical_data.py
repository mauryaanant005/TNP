"""Import the historical batch spreadsheets.

    python manage.py import_historical_data --dry-run
    python manage.py import_historical_data --repair
    python manage.py import_historical_data --batches 2026 2027

Everything runs inside a single transaction. ``--dry-run`` executes the real
inserts and then rolls back, so the counts in the report are what would
actually happen rather than a guess — the same trick
``institution/management/commands/seed_institution.py`` uses.
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from dataimport import normalize, register, repair, roster, sources
from dataimport.report import ImportReport


class _Rollback(Exception):
    """Raised to unwind the transaction at the end of a dry run."""


class Command(BaseCommand):
    help = "Import student rosters and placement registers from the Excel files."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=None,
            help="Directory holding the spreadsheets (default: BASE_DIR).",
        )
        parser.add_argument(
            "--batches",
            nargs="*",
            default=None,
            help="Limit to these batches, e.g. --batches 2026 2027.",
        )
        parser.add_argument(
            "--repair",
            action="store_true",
            help="Also clean up the rows left by the previous import_placements.py "
                 "run: fabricated students, orphans and mis-batched companies.",
        )
        parser.add_argument(
            "--no-prune-companies",
            action="store_true",
            help="With --repair, keep companies that end up holding no offers.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would happen, then roll everything back.",
        )

    # -- helpers -----------------------------------------------------------

    def _collect_uids(self, found):
        """Every UID present in any source — the whitelist for orphan removal."""
        uids = set()
        for source in found:
            try:
                frame = sources.load(source)
            except Exception:
                continue
            column = sources.find_column(frame, "T&P(UID)", "T&P (UID)", "uid")
            if not column:
                continue
            for value in frame[column].tolist():
                if normalize.is_uid(value):
                    uids.add(normalize.clean_text(value))
        return uids

    # -- entry point -------------------------------------------------------

    def handle(self, *args, **options):
        directory = Path(options["path"] or settings.BASE_DIR)
        if not directory.is_dir():
            raise CommandError(f"{directory} is not a directory")

        found = sources.discover(directory, batches=options["batches"])
        if not found:
            raise CommandError(
                f"No importable spreadsheets found in {directory}.\n"
                f"Expected either an 18-column roster (uid, department, full_name, "
                f"email, batch, …) or a 'Students Placement Register' workbook."
            )

        self.stdout.write(f"Found {len(found)} source file(s) in {directory}:")
        for source in found:
            self.stdout.write(f"  {source.kind:9} batch {source.batch or '?':5} {source.name}")
        self.stdout.write("")

        report = ImportReport(dry_run=options["dry_run"])

        try:
            with transaction.atomic():
                if options["repair"]:
                    self.stdout.write("Repairing the previous import…")
                    # Deliberately scans EVERY source, not just the ones
                    # `--batches` selected. The whitelist decides which students
                    # count as orphans, so narrowing it would make a filtered
                    # run delete perfectly good students from other cohorts.
                    repair.run(
                        self._collect_uids(sources.discover(directory)),
                        report,
                        dry_run=False,
                        prune_empty=not options["no_prune_companies"],
                    )

                for source in found:
                    self.stdout.write(f"Importing {source.name}…")
                    if source.kind == sources.ROSTER:
                        roster.import_roster(source, report, dry_run=False)
                    else:
                        register.import_register(source, report, dry_run=False)

                if options["repair"]:
                    # Must run *after* the import: it can only tell a superseded
                    # legacy offer from a still-needed one once the replacement
                    # rows exist.
                    repair.prune_superseded_legacy_offers(report, dry_run=False)

                register.link_students_without_offers(report)
                self._seed_reference_data(report)

                if options["dry_run"]:
                    raise _Rollback
        except _Rollback:
            self.stdout.write(self.style.WARNING("\nDry run — rolled back.\n"))
        except Exception as exc:  # noqa: BLE001 — the report is the deliverable
            report.error(f"{type(exc).__name__}: {exc}")
            self.stdout.write(self.style.ERROR("\nImport failed and was rolled back.\n"))
            self.stdout.write(report.render())
            raise

        self.stdout.write(report.render())

        if report.errors:
            raise CommandError("Import finished with errors — see the report above.")

    def _seed_reference_data(self, report):
        """Refresh ``institution`` from the data we just imported.

        Reuses ``institution.services.seed_from_existing_data`` rather than
        writing a second, divergent harvester — it already knows how to split
        "IT-A" into a department and a division and how to report near-duplicate
        codes.
        """
        try:
            from institution.services import seed_from_existing_data

            result = seed_from_existing_data()
        except Exception as exc:  # noqa: BLE001
            report.anomaly("institution reference data not refreshed", str(exc))
            return
        report.anomaly("institution reference data refreshed", str(result)[:150])
