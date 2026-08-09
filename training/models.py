"""Training attendance — one model instead of five (T-18).

Replaces `AttendanceData`, `BatchAttendance`, `SimpleAttendanceData`,
`AttendanceRecord` and `Program1`. Nobody designed those five; they accreted
because "attendance" had seven consumers across seven apps and no owner
(audit §2.2). This app is that owner.

What the five actually were:

| Old model | Really held | Fate |
|---|---|---|
| `AttendanceData` | one row per student per session | → `SessionAttendance` |
| `SimpleAttendanceData` | the same, with `uid` as an `IntegerField` | → `SessionAttendance` |
| `AttendanceRecord.student_data` | the same again, as an unqueryable JSON blob | → `SessionAttendance` |
| `BatchAttendance` | per-batch present/absent **totals** | derived — recompute, do not migrate |
| `Program1` | per-student attendance **percentages** | derived — recompute, do not migrate |

The last two are aggregates of the first three. Migrating them would store the
same fact twice and let the copies drift, which is how this started.

**Indexes are part of this task, not a follow-up.** At the target size this is
comfortably the largest table in the system — 10,000 students × 40 sessions ×
4 programs × 2 semesters ≈ 3.2M rows a year, ~13M retained — and the entire
codebase currently declares five `db_index=True` in total. Without
`(student, session)` every dashboard aggregate is a full scan.
"""

from django.conf import settings
from django.db import models

from institution.models import Batch, Program, Semester
from student.models import Student


class TrainingSession(models.Model):
    """One sitting of one training program.

    Sessions were previously identified by a free-text string built as
    `f"{date} - Session {n}"` and parsed back apart at read time. The parts are
    columns here.
    """

    PHASE_CHOICES = [
        ("Phase 1", "Phase 1"),
        ("Phase 2", "Phase 2"),
        ("Phase 3", "Phase 3"),
    ]

    program = models.ForeignKey(
        Program, on_delete=models.PROTECT, related_name="training_sessions"
    )
    batch = models.ForeignKey(
        Batch, on_delete=models.PROTECT, related_name="training_sessions",
        null=True, blank=True,
    )
    semester = models.ForeignKey(
        Semester, on_delete=models.PROTECT, related_name="training_sessions",
        null=True, blank=True,
    )
    date = models.DateField(null=True, blank=True)
    session_no = models.PositiveSmallIntegerField()
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default="Phase 1")

    # The exact string this session was reconstructed from. Kept so the
    # backfill is auditable: if a count disagrees, this is what you grep for.
    # It is not read by application code and can be dropped once the legacy
    # tables are gone.
    legacy_label = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "session_no"]
        indexes = [
            models.Index(fields=["program", "batch", "semester"]),
            models.Index(fields=["date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["program", "batch", "semester", "date", "session_no"],
                name="uniq_training_session",
            )
        ]

    def __str__(self):
        return f"{self.program} · {self.date} · session {self.session_no}"


class SessionAttendance(models.Model):
    """One student's attendance at one session.

    `student` is a real foreign key. The old tables joined on a `uid` string
    that was a `CharField` in two models and an `IntegerField` in a third, so
    joins happened in Python dictionaries rather than in SQL — which is why the
    reports are slow (audit §6.1).
    """

    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    STATUS_CHOICES = [
        (PRESENT, "Present"),
        (ABSENT, "Absent"),
        (LATE, "Late"),
    ]

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="session_attendance"
    )
    session = models.ForeignKey(
        TrainingSession, on_delete=models.CASCADE, related_name="attendance"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=ABSENT)

    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_attendance",
    )
    marked_at = models.DateTimeField(auto_now=True)

    # Which legacy table this row was backfilled from, or "" for rows created
    # after the cutover. The verification script groups by this.
    legacy_source = models.CharField(max_length=32, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["student", "session"]),
            models.Index(fields=["session"]),
            # Dashboards count present-vs-total per student; without status in
            # the index that is a scan of every row for the student.
            models.Index(fields=["student", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "session"], name="uniq_student_session"
            )
        ]

    def __str__(self):
        return f"{self.student.uid} · {self.session_id} · {self.status}"
