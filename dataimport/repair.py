"""Undo the damage left by the previous ``import_placements.py`` run.

Four separate problems, deliberately handled by four separate passes so each
one's blast radius is visible in the report:

1. **Fabricated students.** 37 ``Student`` rows — each with a working login —
   created from spreadsheet footer cells. Their UIDs are things like ``3.46``,
   ``AI&ML``, ``10.2`` and ``26``. Identified by failing the UID pattern.

2. **Register-derived orphans.** Rows whose UID *looks* real but came from the
   four bad-suffix lines in the 2026 register (``23-CS&E70-31`` and friends).
   They carry a synthesised login and a blank department and appear in no
   source file. Deleted only when all three hold.

3. **Genuinely misfiled students.** Ten rows sitting in batches 2029–2033 with
   real ``@tcetmumbai.in`` addresses and real departments. These are *not*
   junk — their UID suffixes are wrong at source, and ``Student.save()`` files
   by suffix. Reported, never deleted. Fixing them means correcting a UID,
   which is a decision about a real person's record.

4. **Mis-batched companies.** 157 ``CompanyRegistration`` rows tagged batch
   2028 that hold 584 batch-2026 offers, because the old script took the batch
   as an argument and was called with the wrong one. Each offer is moved to a
   company carrying its own student's batch; companies left holding nothing are
   pruned.
"""

from __future__ import annotations

import datetime as dt

from django.db.models import Count

from internship_api.models import InternshipAcceptance
from placements.models import CompanyRegistration, Notice
from student.models import Student, StudentOffer, StudentPlacementAppliedCompany

from . import normalize, students as student_utils

KNOWN_BATCHES = {"2024", "2025", "2026", "2027", "2028"}


def _delete_student(student, report, bucket):
    user = student.user
    StudentOffer.objects.filter(student=student).delete()
    StudentPlacementAppliedCompany.objects.filter(student=student).delete()

    # `InternshipAcceptance.student` is `on_delete=DO_NOTHING` (audit §6.6), so
    # Django's collector neither cascades nor nulls it — but MySQL still has a
    # real FK constraint, which rejects the delete with error 1451. Anything
    # pointing at a student with DO_NOTHING has to be cleared by hand.
    InternshipAcceptance.objects.filter(student=student).delete()

    student.delete()
    report.deleted[bucket] += 1
    if user is not None and student_utils.is_placeholder(user.email):
        user.delete()
        report.deleted["fabricated login accounts"] += 1


def purge_fabricated_students(report, *, dry_run=False):
    """Pass 1 — UIDs that are not UIDs."""
    for student in Student.objects.select_related("user").all():
        if normalize.is_uid(student.uid):
            continue
        report.anomaly(
            "fabricated student removed",
            f"uid={student.uid!r} batch={student.batch} "
            f"login={student.user.email if student.user else '—'}",
        )
        if not dry_run:
            _delete_student(student, report, "fabricated students")
        else:
            report.deleted["fabricated students"] += 1


def purge_register_orphans(valid_uids, report, *, dry_run=False):
    """Pass 2 — real-looking UIDs that no source file actually contains.

    All three conditions must hold: absent from every source, synthesised
    login, and no department. A student who has any real detail is left alone.
    """
    for student in Student.objects.select_related("user").all():
        if student.uid in valid_uids:
            continue
        if not normalize.is_uid(student.uid):
            continue  # pass 1 owns these
        if student.department:
            continue
        if student.user is not None and not student_utils.is_placeholder(student.user.email):
            continue
        report.anomaly(
            "orphan student removed (in no source file, no department, synthesised login)",
            f"uid={student.uid!r} batch={student.batch}",
        )
        if not dry_run:
            _delete_student(student, report, "orphan students")
        else:
            report.deleted["orphan students"] += 1


def report_misfiled_students(report):
    """Pass 3 — report only. These are real people with a wrong UID."""
    for student in Student.objects.select_related("user").filter().exclude(
        batch__in=KNOWN_BATCHES
    ):
        if not normalize.is_uid(student.uid):
            continue
        report.anomaly(
            "student in an unexpected batch — UID suffix looks wrong at source "
            "(NOT modified; correcting a UID is a decision about a real record)",
            f"uid={student.uid!r} -> batch {student.batch}, dept={student.department!r}, "
            f"login={student.user.email if student.user else '—'}",
        )


def rebatch_companies(report, *, dry_run=False, prune_empty=True):
    """Pass 4 — move each offer onto a company carrying its student's batch."""
    moved = 0
    mismatched = (
        StudentOffer.objects.select_related("student", "company")
        .exclude(company__batch=None)
        .all()
    )
    for offer in mismatched:
        student_batch = offer.student.batch
        if offer.company.batch == student_batch:
            continue

        report.anomaly(
            "offer moved to a correctly-batched company",
            f"{offer.student.uid}: {offer.company.name} "
            f"[{offer.company.batch} -> {student_batch}]",
        )
        if dry_run:
            moved += 1
            continue

        target = CompanyRegistration.objects.filter(
            name=offer.company.name, batch=student_batch
        ).first()
        if target is None:
            source_notice = offer.company.notice
            notice = Notice.objects.create(
                subject=f"{offer.company.name} — batch {student_batch}",
                date=source_notice.date if source_notice else dt.date.today(),
                intro="Imported from the historical placement register.",
                about=source_notice.about if source_notice else "",
                company_registration_link="https://tcetmumbai.in/",
                note="Re-batched during import repair.",
                location=source_notice.location if source_notice else "Mumbai",
                deadline=source_notice.deadline if source_notice else dt.date.today(),
            )
            target = CompanyRegistration.objects.create(
                name=offer.company.name,
                batch=student_batch,
                min_tenth_marks=offer.company.min_tenth_marks,
                min_higher_secondary_marks=offer.company.min_higher_secondary_marks,
                min_cgpa=offer.company.min_cgpa,
                accepted_kt=offer.company.accepted_kt,
                domain=offer.company.domain,
                departments=offer.company.departments,
                is_aedp_or_pli=offer.company.is_aedp_or_pli,
                is_aedp_or_ojt=offer.company.is_aedp_or_ojt,
                selected_departments=offer.company.selected_departments,
                notice=notice,
            )
            report.companies_created += 1
            report.notices_created += 1

        # `unique_together = (student, company, role)` — if the correctly
        # batched offer already exists, this one is a leftover duplicate.
        clash = StudentOffer.objects.filter(
            student=offer.student, company=target, role=offer.role
        ).exclude(pk=offer.pk).first()
        if clash is not None:
            offer.delete()
            report.deleted["duplicate offers"] += 1
            continue

        offer.company = target
        offer.save(update_fields=["company"])
        moved += 1

    report.offers_updated += moved

    if not prune_empty:
        return

    empty = (
        CompanyRegistration.objects.annotate(
            offers=Count("company_offers", distinct=True),
            applications=Count("company", distinct=True),
            roles=Count("job_offers", distinct=True),
        )
        .filter(offers=0, applications=0, roles=0)
    )
    for company in empty:
        report.anomaly(
            "empty company pruned (no offers, applications or roles)",
            f"{company.name} [{company.batch}]",
        )
        if not dry_run:
            notice = company.notice
            company.delete()
            if notice is not None:
                notice.delete()
        report.deleted["empty companies"] += 1


# The old `import_placements.py` wrote this literal string into every offer it
# created, for every student and every employer, because the register has no
# job-title column.
LEGACY_OFFER_ROLE = "Software Engineer"


def prune_superseded_legacy_offers(report, *, dry_run=False):
    """Pass 5 — drop legacy offers the import has replaced. Runs *after* import.

    `StudentOffer` is unique on ``(student, company, role)``. The old script
    used a constant ``role``; this import uses the placement scheme, so the two
    do not collide and a re-import leaves **both** rows — doubling every offer
    count, every salary average and every placement chart.

    Only a legacy row that now sits alongside a real one for the same student
    and company is removed. A legacy offer with no replacement is left alone
    and reported: it means the import did not cover that row, which is worth
    knowing rather than silently deleting.
    """
    legacy = StudentOffer.objects.filter(role=LEGACY_OFFER_ROLE).select_related(
        "student", "company"
    )
    superseded, orphaned = 0, 0

    for offer in legacy:
        replacement = (
            StudentOffer.objects.filter(student=offer.student, company=offer.company)
            .exclude(role=LEGACY_OFFER_ROLE)
            .exists()
        )
        if not replacement:
            orphaned += 1
            report.anomaly(
                "legacy offer kept — the import produced no replacement for it",
                f"{offer.student.uid} / {offer.company.name} [{offer.company.batch}]",
            )
            continue
        superseded += 1
        if not dry_run:
            offer.delete()
        report.deleted["superseded legacy offers"] += 1

    if superseded:
        report.anomaly(
            "legacy offers replaced by imported ones",
            f"{superseded} rows written by the previous import_placements.py "
            f"(role={LEGACY_OFFER_ROLE!r}) removed in favour of the register's "
            f"own placement scheme",
        )
    if orphaned:
        report.anomaly(
            "legacy offers with no import replacement (left in place)",
            f"{orphaned} rows — check whether their register rows were rejected",
        )


def run(valid_uids, report, *, dry_run=False, prune_empty=True):
    purge_fabricated_students(report, dry_run=dry_run)
    purge_register_orphans(valid_uids, report, dry_run=dry_run)
    report_misfiled_students(report)
    rebatch_companies(report, dry_run=dry_run, prune_empty=prune_empty)
