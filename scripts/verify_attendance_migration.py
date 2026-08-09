#!/usr/bin/env python
"""Verify the attendance backfill (T-18). **A human runs this, not an agent.**

    docker exec t_and_p_automation-api-1 python scripts/verify_attendance_migration.py

Compares per-student attendance totals in the five legacy models against
`training.SessionAttendance`, one student at a time, and prints every
disagreement.

**Expected result: zero mismatches. Any mismatch means roll back — do not debug
forward.** The old tables are still there and still authoritative until you
decide otherwise; a half-corrected migration is worse than an un-run one,
because you can no longer tell which numbers were right.

Read-only. It writes nothing and can be run as many times as you like.

Exit status: 0 if every student matches, 1 otherwise — so it can gate a deploy.
"""

import os
import sys
from collections import defaultdict

import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db.models import Count, Q  # noqa: E402

from program_coordinator_api.models import (  # noqa: E402
    AttendanceData,
    AttendanceRecord,
    SimpleAttendanceData,
)
from student.models import Student  # noqa: E402
from training.backfill import normalise_status, parse_session_label  # noqa: E402
from training.models import SessionAttendance  # noqa: E402

PRESENT = SessionAttendance.PRESENT
LATE = SessionAttendance.LATE

# How many mismatching students to print in full before summarising.
MAX_DETAIL = 40


def legacy_totals():
    """Per-UID (total, present) across every legacy source.

    Counted the same way the application counted them: `AttendanceData` rows
    with `present='Present'` were the numerator everywhere in the old code.
    """
    totals = defaultdict(lambda: [0, 0])

    for row in AttendanceData.objects.values("uid").annotate(
        total=Count("id"),
        present=Count("id", filter=Q(present__iexact="Present")),
    ):
        uid = str(row["uid"]).strip()
        totals[uid][0] += row["total"]
        totals[uid][1] += row["present"]

    for row in SimpleAttendanceData.objects.values("uid").annotate(
        total=Count("id"),
        present=Count("id", filter=Q(present__iexact="Present")),
    ):
        uid = str(row["uid"]).strip()
        totals[uid][0] += row["total"]
        totals[uid][1] += row["present"]

    # The JSON blob has to be walked in Python - that is exactly why it is
    # being migrated.
    for record in AttendanceRecord.objects.all().iterator(chunk_size=200):
        for entry in record.student_data or []:
            identity = (entry or {}).get("student_data") or []
            if not identity:
                continue
            uid = str(identity[0]).strip()
            for day in (entry or {}).get("sessions") or []:
                for mark in day or []:
                    totals[uid][0] += 1
                    if normalise_status(mark) in (PRESENT, LATE):
                        totals[uid][1] += 1

    return totals


def new_totals():
    """Per-UID (total, present) from SessionAttendance."""
    totals = {}
    for row in SessionAttendance.objects.values("student__uid").annotate(
        total=Count("id"),
        present=Count("id", filter=Q(status__in=[PRESENT, LATE])),
    ):
        totals[str(row["student__uid"]).strip()] = (row["total"], row["present"])
    return totals


def main():
    print("Attendance migration verification")
    print("=" * 72)

    known_uids = {str(u).strip() for u in Student.objects.values_list("uid", flat=True)}

    old = legacy_totals()
    new = new_totals()

    print(f"UIDs in legacy tables      : {len(old)}")
    print(f"UIDs in SessionAttendance  : {len(new)}")
    print(f"Students in the Student table: {len(known_uids)}")
    print()

    # A legacy UID with no Student row could never be migrated - the new table
    # has a real foreign key. Report it separately from a genuine mismatch,
    # because the fix is different: this is bad data, not a bad migration.
    orphan_uids = sorted(uid for uid in old if uid not in known_uids)
    if orphan_uids:
        orphan_rows = sum(old[uid][0] for uid in orphan_uids)
        print(f"!! {len(orphan_uids)} legacy UIDs have no Student row "
              f"({orphan_rows} attendance rows).")
        print("   These CANNOT be migrated - SessionAttendance.student is a real FK.")
        print("   Either the UID is a typo or the student was deleted. Decide before")
        print("   you trust the totals below.")
        for uid in orphan_uids[:MAX_DETAIL]:
            print(f"     {uid!r:<24} {old[uid][0]} rows")
        if len(orphan_uids) > MAX_DETAIL:
            print(f"     ... and {len(orphan_uids) - MAX_DETAIL} more")
        print()

    mismatches = []
    for uid in sorted(known_uids | set(new)):
        old_total, old_present = old.get(uid, (0, 0))
        new_total, new_present = new.get(uid, (0, 0))
        if (old_total, old_present) != (new_total, new_present):
            mismatches.append((uid, old_total, old_present, new_total, new_present))

    compared = len(known_uids | set(new))
    print(f"Students compared          : {compared}")
    print(f"Mismatches                 : {len(mismatches)}")
    print()

    if mismatches:
        print(f"{'UID':<26}{'old tot':>9}{'old pres':>10}{'new tot':>9}{'new pres':>10}")
        print("-" * 72)
        for uid, ot, op, nt, np_ in mismatches[:MAX_DETAIL]:
            print(f"{uid:<26}{ot:>9}{op:>10}{nt:>9}{np_:>10}")
        if len(mismatches) > MAX_DETAIL:
            print(f"... and {len(mismatches) - MAX_DETAIL} more")
        print()
        print("=" * 72)
        print("FAILED. Roll back; do not debug forward.")
        print("The legacy tables are untouched and still authoritative.")
        return 1

    if orphan_uids:
        print("=" * 72)
        print("Every migratable student matches, but orphan UIDs were skipped")
        print("(listed above). Confirm each is genuinely not a real student.")
        return 1

    print("=" * 72)
    print("PASSED. Every student's totals match across all sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
