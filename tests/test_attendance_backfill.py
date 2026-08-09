"""Attendance backfill (T-18).

These prove the *logic* on synthetic data. They are not, and cannot be, the
verification that matters — that is `scripts/verify_attendance_migration.py`,
run by a human against a copy of the real database, per rule 2 in
`docs/AGENTS_PROMPT.md`. An agent's tests passing on data the agent invented is
not evidence that 1,400 real students' attendance survived.

What these do establish: the parsing is right, duplicates collapse the way the
unique constraint requires, and — the important one — **nothing is dropped
silently.**
"""

import datetime

import pytest
from django.utils import timezone

from institution.models import Batch, Program, Semester
from program_coordinator_api.models import (
    AttendanceData,
    AttendanceRecord,
    SimpleAttendanceData,
)
from training.backfill import backfill, normalise_status, parse_session_label
from training.models import SessionAttendance, TrainingSession
from tests import factories

pytestmark = pytest.mark.django_db


@pytest.fixture
def reference_data():
    Program.objects.create(code="ACT_Technical")
    Batch.objects.create(code="2025")
    for n in range(1, 9):
        Semester.objects.create(code=f"Semester {n}", number=n)


def _attendance_row(student, session, present="Present", **kwargs):
    return AttendanceData.objects.create(
        uid=student.uid,
        name="Test",
        batch=kwargs.pop("batch", "2025"),
        program_name=kwargs.pop("program_name", "ACT_Technical"),
        session=session,
        present=present,
        late=kwargs.pop("late", "Not Late"),
        year="2025",
        semester=kwargs.pop("semester", "Semester 1"),
        timestamp=timezone.now(),
    )


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "label,expected",
    [
        ("2026-01-14 - Session 3", (datetime.date(2026, 1, 14), 3)),
        ("14/01/2026 - Session 3", (datetime.date(2026, 1, 14), 3)),
        ("2026-01-14 - Session 12", (datetime.date(2026, 1, 14), 12)),
        # No date half — the column is nullable, so this is still migratable.
        ("Session 2", (None, 2)),
        # Unparseable: must yield no session number, so the row is reported.
        ("", (None, None)),
        ("no session here", (None, None)),
    ],
)
def test_session_label_parsing(label, expected):
    assert parse_session_label(label) == expected


@pytest.mark.parametrize(
    "present,late,expected",
    [
        ("Present", "Not Late", "present"),
        ("present", None, "present"),
        ("Absent", None, "absent"),
        ("", None, "absent"),
        (None, None, "absent"),
        # `late` wins: the student was there, and the old schema recorded that
        # in a second column.
        ("Present", "Late", "late"),
        ("Absent", "Late", "late"),
    ],
)
def test_status_normalisation(present, late, expected):
    assert normalise_status(present, late) == expected


def test_unrecognised_status_is_absent_and_reported(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1", present="Maybe")

    report = backfill()

    assert SessionAttendance.objects.get().status == SessionAttendance.ABSENT
    assert report.unknown_statuses["Maybe"] == 1


# ---------------------------------------------------------------------------
# AttendanceData
# ---------------------------------------------------------------------------

def test_migrates_rows_into_sessions_and_attendance(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1", present="Present")
    _attendance_row(student, "2026-01-14 - Session 2", present="Absent")

    report = backfill()

    assert TrainingSession.objects.count() == 2
    assert SessionAttendance.objects.count() == 2
    assert report.attendance_created == 2
    assert report.total_skipped == 0

    session = TrainingSession.objects.get(session_no=1)
    assert session.date == datetime.date(2026, 1, 14)
    assert session.program.code == "ACT_Technical"
    assert session.batch.code == "2025"
    assert session.semester.code == "Semester 1"


def test_two_students_share_one_session(reference_data):
    a = factories.StudentFactory(uid="0001-CMPN001-25")
    b = factories.StudentFactory(uid="0002-CMPN002-25")
    _attendance_row(a, "2026-01-14 - Session 1")
    _attendance_row(b, "2026-01-14 - Session 1")

    backfill()

    assert TrainingSession.objects.count() == 1
    assert SessionAttendance.objects.count() == 2


def test_running_twice_changes_nothing(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1")

    first = backfill()
    second = backfill()

    assert SessionAttendance.objects.count() == 1
    assert TrainingSession.objects.count() == 1
    assert first.attendance_created == 1
    assert second.attendance_created == 0
    assert second.attendance_existing == 1


def test_duplicate_student_session_pairs_are_counted_not_crashed(reference_data):
    """The legacy tables have no unique constraint, so the same student can
    appear twice for one session. The new schema forbids it — that has to
    collapse to one row and be reported, not raise."""
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1", present="Present")
    _attendance_row(student, "2026-01-14 - Session 1", present="Absent")

    report = backfill()

    assert SessionAttendance.objects.count() == 1
    assert report.duplicate_pairs == 1


# ---------------------------------------------------------------------------
# Nothing is dropped silently — the headline requirement
# ---------------------------------------------------------------------------

def test_unknown_uid_is_reported_not_dropped(reference_data):
    factories.StudentFactory(uid="0001-CMPN001-25")
    AttendanceData.objects.create(
        uid="9999-GHOST-99", name="Ghost", batch="2025",
        program_name="ACT_Technical", session="2026-01-14 - Session 1",
        present="Present", late="Not Late", year="2025",
        semester="Semester 1", timestamp=timezone.now(),
    )

    report = backfill()

    assert SessionAttendance.objects.count() == 0
    assert report.unknown_uids["9999-GHOST-99"] == 1
    assert report.total_skipped == 1


def test_unparseable_session_label_is_reported(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "nonsense label")

    report = backfill()

    assert SessionAttendance.objects.count() == 0
    assert report.unparsed_labels["nonsense label"] == 1
    assert report.total_skipped == 1


def test_unseeded_program_is_reported(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1", program_name="NOT_SEEDED")

    report = backfill()

    assert SessionAttendance.objects.count() == 0
    assert report.missing_programs["NOT_SEEDED"] == 1
    assert report.total_skipped == 1


def test_report_text_names_the_skipped_rows(reference_data):
    factories.StudentFactory(uid="0001-CMPN001-25")
    AttendanceData.objects.create(
        uid="9999-GHOST-99", name="Ghost", batch="2025",
        program_name="ACT_Technical", session="2026-01-14 - Session 1",
        present="Present", late="Not Late", year="2025",
        semester="Semester 1", timestamp=timezone.now(),
    )

    text = backfill().as_text()

    assert "9999-GHOST-99" in text
    assert "TOTAL ROWS SKIPPED           : 1" in text
    assert "NOT CLEAN" in text


def test_clean_run_says_so(reference_data):
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    _attendance_row(student, "2026-01-14 - Session 1")

    text = backfill().as_text()

    assert "No rows skipped" in text
    assert "NOT CLEAN" not in text


# ---------------------------------------------------------------------------
# The JSON blob
# ---------------------------------------------------------------------------

def test_json_blob_is_flattened_into_rows(reference_data):
    """`AttendanceRecord.student_data` held every student's attendance for a
    whole program in one unqueryable JSON column. Two students × two days ×
    two sessions = eight rows."""
    a = factories.StudentFactory(uid="0001-CMPN001-25")
    b = factories.StudentFactory(uid="0002-CMPN002-25")

    AttendanceRecord.objects.create(
        program_name="ACT_Technical",
        year="2025",
        num_sessions=2,
        num_days=2,
        dates=["2026-01-14", "2026-01-15"],
        file_headers=[],
        semester="Semester 1",
        phase="Phase 1",
        student_data=[
            {"student_data": [a.uid, "A", "2025"],
             "sessions": [["Present", "Present"], ["Absent", "Present"]]},
            {"student_data": [b.uid, "B", "2025"],
             "sessions": [["Absent", "Absent"], ["Present", "Present"]]},
        ],
    )

    report = backfill()

    assert SessionAttendance.objects.count() == 8
    assert report.total_skipped == 0
    # Session numbering restarts per day, so (date, session_no) identifies a
    # session and there are four of them.
    assert TrainingSession.objects.count() == 4

    present_for_a = SessionAttendance.objects.filter(
        student=a, status=SessionAttendance.PRESENT
    ).count()
    assert present_for_a == 3


def test_json_blob_with_a_missing_date_still_migrates(reference_data):
    """`dates` shorter than `sessions` happens in the real data. The date
    column is nullable, so the rows migrate with date=None rather than being
    dropped."""
    student = factories.StudentFactory(uid="0001-CMPN001-25")
    AttendanceRecord.objects.create(
        program_name="ACT_Technical", year="2025", num_sessions=1, num_days=2,
        dates=["2026-01-14"], file_headers=[], semester="Semester 1", phase="Phase 1",
        student_data=[
            {"student_data": [student.uid, "A", "2025"],
             "sessions": [["Present"], ["Present"]]},
        ],
    )

    report = backfill()

    assert SessionAttendance.objects.count() == 2
    assert report.total_skipped == 0
    assert TrainingSession.objects.filter(date__isnull=True).count() == 1


# ---------------------------------------------------------------------------
# SimpleAttendanceData
# ---------------------------------------------------------------------------

def test_simple_attendance_without_a_program_is_reported_not_guessed(reference_data):
    """`SimpleAttendanceData` has no program column at all. Rather than
    attribute its rows to an arbitrary program, they are reported."""
    student = factories.StudentFactory(uid="12345")
    SimpleAttendanceData.objects.create(
        uid=12345, name="Test", batch="2025",
        session="2026-01-14 - Session 1", present="Present",
    )

    report = backfill()

    assert SessionAttendance.objects.count() == 0
    assert report.rows_read["SimpleAttendanceData"] == 1
    assert sum(report.missing_programs.values()) == 1


# ---------------------------------------------------------------------------
# Derived tables are deliberately not migrated
# ---------------------------------------------------------------------------

def test_batch_attendance_and_program1_are_not_sources():
    """Both hold totals derived from the per-student rows. Migrating them would
    store the same fact twice — which is how five models happened."""
    import inspect

    from training import backfill as module

    source = inspect.getsource(module)
    assert "BatchAttendance.objects" not in source
    assert "Program1.objects" not in source
