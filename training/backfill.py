"""Backfill the five legacy attendance models into `SessionAttendance` (T-18).

> **This is the highest-risk operation in the whole plan, and an agent must not
> run it.** It is deliberately *not* a Django data migration: `entrypoint.sh`
> runs `manage.py migrate --noinput` on every container start, so a data
> migration would apply itself on the next deploy with nobody watching. It is a
> management command instead, run by hand, against a copy, with the output
> read by a person — see `docs/PHASE_2_IMPLEMENTATION.md`.

Design rules, in order of importance:

1. **Never drop a row silently.** A UID with no matching `Student`, an
   unparseable session label, a status string nobody anticipated — all are
   collected and reported. The count of skipped rows is the headline number.
2. **Idempotent.** `get_or_create` throughout, keyed on the same unique
   constraints the schema declares. Running it twice must not double anything.
3. **Auditable.** Every row records which legacy table it came from and every
   session keeps the exact string it was reconstructed from.

`BatchAttendance` and `Program1` are deliberately **not** migrated: they hold
totals and percentages derived from the per-student rows. Copying them would
store the same fact twice, which is what produced five models in the first
place.
"""

import json
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime

from django.db import transaction

from institution.models import Batch, Program, Semester
from student.models import Student
from training.models import SessionAttendance, TrainingSession

# "2026-01-14 - Session 3", "14/01/2026 - Session 3", "Session 2"
_SESSION_LABEL = re.compile(r"^\s*(?P<date>.*?)\s*-?\s*session\s*(?P<no>\d+)\s*$", re.I)

_DATE_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d %b %Y", "%d %B %Y"]

# The legacy `present` / `late` columns are free text with no constraint.
_STATUS_MAP = {
    "present": SessionAttendance.PRESENT,
    "p": SessionAttendance.PRESENT,
    "1": SessionAttendance.PRESENT,
    "true": SessionAttendance.PRESENT,
    "yes": SessionAttendance.PRESENT,
    "absent": SessionAttendance.ABSENT,
    "a": SessionAttendance.ABSENT,
    "0": SessionAttendance.ABSENT,
    "false": SessionAttendance.ABSENT,
    "no": SessionAttendance.ABSENT,
    "": SessionAttendance.ABSENT,
    "late": SessionAttendance.LATE,
    "l": SessionAttendance.LATE,
}


@dataclass
class BackfillReport:
    """What happened. Read the `skipped` sections before believing the totals."""

    sessions_created: int = 0
    attendance_created: int = 0
    attendance_existing: int = 0

    rows_read: Counter = field(default_factory=Counter)
    rows_written: Counter = field(default_factory=Counter)

    unknown_uids: Counter = field(default_factory=Counter)
    unparsed_labels: Counter = field(default_factory=Counter)
    unknown_statuses: Counter = field(default_factory=Counter)
    missing_programs: Counter = field(default_factory=Counter)
    duplicate_pairs: int = 0

    @property
    def total_skipped(self):
        return (
            sum(self.unknown_uids.values())
            + sum(self.unparsed_labels.values())
            + sum(self.missing_programs.values())
        )

    def as_text(self):
        L = ["Attendance backfill report", "=" * 68, ""]
        L.append("Rows read from each legacy source:")
        for source, n in sorted(self.rows_read.items()):
            written = self.rows_written.get(source, 0)
            L.append(f"  {source:<24} read {n:>8}   written {written:>8}")
        L += [
            "",
            f"TrainingSession rows created : {self.sessions_created}",
            f"SessionAttendance created    : {self.attendance_created}",
            f"SessionAttendance already had: {self.attendance_existing}",
            f"Duplicate (student, session) : {self.duplicate_pairs}"
            "   <- collapsed by the unique constraint",
            "",
            f"TOTAL ROWS SKIPPED           : {self.total_skipped}",
            "",
        ]

        def section(title, counter, note):
            if not counter:
                return [f"{title}: none", ""]
            out = [f"{title}: {sum(counter.values())} rows, {len(counter)} distinct", f"  {note}", ""]
            for value, n in counter.most_common(30):
                out.append(f"    {n:>7} x  {value!r}")
            if len(counter) > 30:
                out.append(f"    ... and {len(counter) - 30} more")
            out.append("")
            return out

        L += section(
            "UIDs with no matching Student",
            self.unknown_uids,
            "These students' attendance is NOT migrated. Either the UID is a typo "
            "in the spreadsheet, or the student was deleted. Decide which.",
        )
        L += section(
            "Session labels that could not be parsed",
            self.unparsed_labels,
            "Every row under a label listed here is skipped.",
        )
        L += section(
            "Programs not present in institution.Program",
            self.missing_programs,
            "Run `manage.py seed_institution` first, or add the program by hand.",
        )
        L += section(
            "Status values not recognised",
            self.unknown_statuses,
            "Treated as ABSENT. Check none of these meant 'present'.",
        )

        L.append("=" * 68)
        if self.total_skipped:
            L.append("NOT CLEAN. Do not migrate production until the skips above are")
            L.append("explained. A skipped row is a student whose attendance vanishes.")
        else:
            L.append("No rows skipped. Now run scripts/verify_attendance_migration.py")
            L.append("and check that the per-student totals match.")
        return "\n".join(L)


def parse_session_label(label):
    """"2026-01-14 - Session 3" -> (date, 3). Returns (None, None) if unparseable.

    The date half is optional: some rows are just "Session 2".
    """
    if not label:
        return None, None
    match = _SESSION_LABEL.match(str(label))
    if not match:
        return None, None

    session_no = int(match.group("no"))
    raw_date = (match.group("date") or "").strip()
    if not raw_date:
        return None, session_no

    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw_date, fmt).date(), session_no
        except ValueError:
            continue
    # A session number without a usable date is still worth migrating; the
    # date column is nullable.
    return None, session_no


def normalise_status(present_value, late_value=None, report=None):
    """Legacy `present`/`late` columns -> a single status.

    `late` wins over `present`: a student marked both was there, but late, and
    the old schema recorded that in two columns.
    """
    if late_value is not None and str(late_value).strip().casefold() in {"late", "l", "true", "1", "yes"}:
        return SessionAttendance.LATE

    key = str(present_value or "").strip().casefold()
    if key in _STATUS_MAP:
        return _STATUS_MAP[key]
    if report is not None:
        report.unknown_statuses[str(present_value)] += 1
    return SessionAttendance.ABSENT


class _Resolver:
    """Caches the reference-data and Student lookups.

    Without this the backfill issues one query per row, which at ~1.4M legacy
    rows is the difference between minutes and hours.
    """

    def __init__(self, report):
        self.report = report
        self.students = {
            str(uid).strip(): pk
            for uid, pk in Student.objects.values_list("uid", "id")
        }
        # UIDs are compared case-insensitively: SimpleAttendanceData stored
        # them as integers, AttendanceData as free text.
        self.students_ci = {k.casefold(): v for k, v in self.students.items()}
        self.programs = {p.code.casefold(): p for p in Program.objects.all()}
        self.batches = {b.code.casefold(): b for b in Batch.objects.all()}
        self.semesters = {s.code.casefold(): s for s in Semester.objects.all()}
        self._sessions = {}

    def student_id(self, uid):
        if uid is None:
            return None
        key = str(uid).strip()
        found = self.students.get(key) or self.students_ci.get(key.casefold())
        if found is None:
            self.report.unknown_uids[key] += 1
        return found

    def program(self, name):
        if not name:
            self.report.missing_programs["<blank>"] += 1
            return None
        found = self.programs.get(str(name).strip().casefold())
        if found is None:
            self.report.missing_programs[str(name).strip()] += 1
        return found

    def session(self, *, program, batch_code, semester_code, date, session_no, label):
        """get_or_create a TrainingSession, memoised on its unique key."""
        batch = self.batches.get(str(batch_code or "").strip().casefold())
        semester = self.semesters.get(str(semester_code or "").strip().casefold())
        key = (program.pk, batch.pk if batch else None, semester.pk if semester else None, date, session_no)
        if key in self._sessions:
            return self._sessions[key]

        session, created = TrainingSession.objects.get_or_create(
            program=program,
            batch=batch,
            semester=semester,
            date=date,
            session_no=session_no,
            defaults={"legacy_label": str(label or "")[:255]},
        )
        if created:
            self.report.sessions_created += 1
        self._sessions[key] = session
        return session


def _write(rows, resolver, report, source):
    """Insert SessionAttendance rows, collapsing duplicates.

    `rows` is an iterable of (student_id, session, status). The unique
    constraint means a duplicate (student, session) in the legacy data has to
    resolve to one row - last write wins, and the count is reported.
    """
    seen = {}
    for student_id, session, status in rows:
        key = (student_id, session.pk)
        if key in seen:
            report.duplicate_pairs += 1
        seen[key] = status

    existing = set(
        SessionAttendance.objects.filter(
            session_id__in={s for _, s in seen}
        ).values_list("student_id", "session_id")
    )

    to_create = [
        SessionAttendance(
            student_id=student_id,
            session_id=session_id,
            status=status,
            legacy_source=source,
        )
        for (student_id, session_id), status in seen.items()
        if (student_id, session_id) not in existing
    ]
    SessionAttendance.objects.bulk_create(to_create, batch_size=2000)

    report.attendance_created += len(to_create)
    report.attendance_existing += len(seen) - len(to_create)
    report.rows_written[source] += len(to_create)


def _backfill_attendance_data(resolver, report):
    """`AttendanceData` — the main per-student-per-session table."""
    from program_coordinator_api.models import AttendanceData

    source = "AttendanceData"
    rows = []
    for rec in AttendanceData.objects.all().iterator(chunk_size=2000):
        report.rows_read[source] += 1

        student_id = resolver.student_id(rec.uid)
        if student_id is None:
            continue

        program = resolver.program(rec.program_name)
        if program is None:
            continue

        date, session_no = parse_session_label(rec.session)
        if session_no is None:
            report.unparsed_labels[str(rec.session)] += 1
            continue

        session = resolver.session(
            program=program,
            batch_code=rec.batch,
            semester_code=rec.semester,
            date=date,
            session_no=session_no,
            label=rec.session,
        )
        rows.append((student_id, session, normalise_status(rec.present, rec.late, report)))

    _write(rows, resolver, report, source)


def _backfill_simple_attendance(resolver, report):
    """`SimpleAttendanceData` — same shape, `uid` as an IntegerField, and no
    program column at all, so its rows can only be attributed if a program of
    the same name as the batch exists. In practice this table is nearly empty;
    anything in it is reported rather than guessed at."""
    from program_coordinator_api.models import SimpleAttendanceData

    source = "SimpleAttendanceData"
    rows = []
    for rec in SimpleAttendanceData.objects.all().iterator(chunk_size=2000):
        report.rows_read[source] += 1

        student_id = resolver.student_id(rec.uid)
        if student_id is None:
            continue

        # No program column exists on this model. Rather than invent one, the
        # row is reported and skipped.
        program = resolver.program(getattr(rec, "program_name", None))
        if program is None:
            continue

        date, session_no = parse_session_label(rec.session)
        if session_no is None:
            report.unparsed_labels[str(rec.session)] += 1
            continue

        session = resolver.session(
            program=program,
            batch_code=rec.batch,
            semester_code=None,
            date=date,
            session_no=session_no,
            label=rec.session,
        )
        rows.append((student_id, session, normalise_status(rec.present, None, report)))

    _write(rows, resolver, report, source)


def _backfill_attendance_record(resolver, report):
    """`AttendanceRecord.student_data` — the JSON blob.

    Shape, from `CreateAttendanceRecord`:

        student_data = [
            {"student_data": [uid, name, batch],
             "sessions": [[s1, s2, ...],   # day 1
                          [s1, s2, ...]]}, # day 2
            ...
        ]
        dates = ["2026-01-14", "2026-01-15", ...]   # parallel to `sessions`

    Session numbering restarts per day in the source, but `TrainingSession` is
    keyed on (date, session_no), so that is preserved rather than flattened.
    """
    from program_coordinator_api.models import AttendanceRecord

    source = "AttendanceRecord.student_data"
    rows = []
    for record in AttendanceRecord.objects.all().iterator(chunk_size=200):
        program = resolver.program(record.program_name)
        if program is None:
            report.rows_read[source] += len(record.student_data or [])
            continue

        raw_dates = record.dates
        if isinstance(raw_dates, str):
            try:
                raw_dates = json.loads(raw_dates)
            except (ValueError, TypeError):
                raw_dates = []
        dates = []
        for value in raw_dates or []:
            parsed, _ = parse_session_label(f"{value} - Session 1")
            dates.append(parsed)

        entries = record.student_data
        if isinstance(entries, str):
            try:
                entries = json.loads(entries)
            except (ValueError, TypeError):
                entries = []

        for entry in entries or []:
            identity = (entry or {}).get("student_data") or []
            uid = identity[0] if identity else None
            batch_code = identity[2] if len(identity) > 2 else None

            day_sessions = (entry or {}).get("sessions") or []
            for day_index, marks in enumerate(day_sessions):
                for session_index, mark in enumerate(marks or []):
                    report.rows_read[source] += 1

                    student_id = resolver.student_id(uid)
                    if student_id is None:
                        continue

                    date = dates[day_index] if day_index < len(dates) else None
                    session = resolver.session(
                        program=program,
                        batch_code=batch_code,
                        semester_code=record.semester,
                        date=date,
                        session_no=session_index + 1,
                        label=f"{date} - Session {session_index + 1}",
                    )
                    rows.append((student_id, session, normalise_status(mark, None, report)))

    _write(rows, resolver, report, source)


@transaction.atomic
def backfill():
    """Run every source. Wrapped in one transaction: a partial backfill is
    worse than none, because the verification script would then compare against
    a half-populated table and the numbers would look plausibly wrong."""
    report = BackfillReport()
    resolver = _Resolver(report)

    _backfill_attendance_data(resolver, report)
    _backfill_simple_attendance(resolver, report)
    _backfill_attendance_record(resolver, report)

    return report
