"""The import report.

Every importer writes into one of these and the command prints it at the end.
Counters are deliberately flat and additive so a multi-file run reads as one
document, and every rejected row is recorded with its sheet row number — a row
that vanishes silently is the failure mode that produced the current mess.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field


@dataclass
class ImportReport:
    dry_run: bool = False

    files_processed: list = field(default_factory=list)
    rows_read: int = 0

    students_created: int = 0
    students_updated: int = 0
    students_unchanged: int = 0

    users_created: int = 0
    users_relinked: int = 0

    companies_created: int = 0
    notices_created: int = 0

    offers_created: int = 0
    offers_updated: int = 0

    attendance_created: int = 0
    training_performance_created: int = 0
    internships_created: int = 0
    sessions_created: int = 0

    duplicates_skipped: int = 0
    invalid_skipped: int = 0

    deleted: Counter = field(default_factory=Counter)
    # rejected rows: reason -> [(file, sheet_row, raw_value)]
    rejects: dict = field(default_factory=lambda: defaultdict(list))
    anomalies: dict = field(default_factory=lambda: defaultdict(list))
    errors: list = field(default_factory=list)

    # -- recording ---------------------------------------------------------

    def reject(self, reason, file, row_no, value=""):
        self.rejects[reason].append((file, row_no, str(value)[:80]))
        self.invalid_skipped += 1

    def anomaly(self, reason, detail):
        self.anomalies[reason].append(str(detail)[:160])

    def error(self, message):
        self.errors.append(str(message))

    # -- serialising ---------------------------------------------------------

    def to_dict(self) -> dict:
        """JSON-safe snapshot for API responses.

        The Celery result backend (Redis, `CELERY_RESULT_SERIALIZER = "json"`)
        cannot round-trip `Counter`/`defaultdict`/tuples, so this flattens them
        to plain dicts/lists/strings. `render()` stays untouched for the CLI.
        """
        return {
            "dry_run": self.dry_run,
            "files_processed": list(self.files_processed),
            "rows_read": self.rows_read,
            "students_created": self.students_created,
            "students_updated": self.students_updated,
            "students_unchanged": self.students_unchanged,
            "users_created": self.users_created,
            "users_relinked": self.users_relinked,
            "companies_created": self.companies_created,
            "notices_created": self.notices_created,
            "offers_created": self.offers_created,
            "offers_updated": self.offers_updated,
            "attendance_created": self.attendance_created,
            "training_performance_created": self.training_performance_created,
            "internships_created": self.internships_created,
            "sessions_created": self.sessions_created,
            "duplicates_skipped": self.duplicates_skipped,
            "invalid_skipped": self.invalid_skipped,
            "deleted": dict(self.deleted),
            "rejects": {
                reason: [{"file": f, "row": row_no, "value": v} for f, row_no, v in rows]
                for reason, rows in self.rejects.items()
            },
            "anomalies": dict(self.anomalies),
            "errors": list(self.errors),
        }

    # -- rendering ---------------------------------------------------------

    def render(self) -> str:
        out = []
        add = out.append
        bar = "=" * 72

        add(bar)
        add("  IMPORT REPORT" + ("   [DRY RUN — nothing was committed]" if self.dry_run else ""))
        add(bar)

        add("")
        add(f"Files processed ................ {len(self.files_processed)}")
        for name in self.files_processed:
            add(f"    - {name}")
        add(f"Total rows read ................ {self.rows_read}")

        add("")
        add("-- Students " + "-" * 60)
        add(f"  created ...................... {self.students_created}")
        add(f"  updated ...................... {self.students_updated}")
        add(f"  already current .............. {self.students_unchanged}")
        add(f"  login accounts created ....... {self.users_created}")
        add(f"  login accounts corrected ..... {self.users_relinked}")

        add("")
        add("-- Placements " + "-" * 58)
        add(f"  companies created ............ {self.companies_created}")
        add(f"  notices created .............. {self.notices_created}")
        add(f"  offers created ............... {self.offers_created}")
        add(f"  offers updated ............... {self.offers_updated}")

        if self.sessions_created or self.attendance_created or \
                self.training_performance_created or self.internships_created:
            add("")
            add("-- Training / internships " + "-" * 46)
            add(f"  training sessions ............ {self.sessions_created}")
            add(f"  attendance records ........... {self.attendance_created}")
            add(f"  training performance rows .... {self.training_performance_created}")
            add(f"  internship records ........... {self.internships_created}")

        add("")
        add("-- Skipped " + "-" * 61)
        add(f"  duplicate rows ............... {self.duplicates_skipped}")
        add(f"  invalid rows ................. {self.invalid_skipped}")

        if self.deleted:
            add("")
            add("-- Deleted " + "-" * 61)
            for key, n in sorted(self.deleted.items()):
                add(f"  {key:.<29} {n}")

        if self.rejects:
            add("")
            add("-- Rejected rows, by reason " + "-" * 44)
            for reason, rows in sorted(self.rejects.items()):
                add(f"  {reason} ({len(rows)})")
                for file, row_no, value in rows[:8]:
                    add(f"      {file} row {row_no}: {value!r}")
                if len(rows) > 8:
                    add(f"      … and {len(rows) - 8} more")

        if self.anomalies:
            add("")
            add("-- Anomalies (imported, but check these) " + "-" * 31)
            for reason, items in sorted(self.anomalies.items()):
                add(f"  {reason} ({len(items)})")
                for item in items[:10]:
                    add(f"      {item}")
                if len(items) > 10:
                    add(f"      … and {len(items) - 10} more")

        if self.errors:
            add("")
            add("-- ERRORS " + "-" * 62)
            for message in self.errors:
                add(f"  ! {message}")

        add("")
        add(bar)
        return "\n".join(out)
