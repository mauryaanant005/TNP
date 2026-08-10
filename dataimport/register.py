"""The "Students Placement Register" workbooks — one row per offer.

    Sr. No. | Branch Div | T&P(UID) | Student Name |
    Employer Visit and Result Announcement Date |
    Employer Category Cat-1/Cat-2/Cat-3 | Type of Placement | Employer  Name |
    Stipend Offered | Salary offered for Placement ( INR-LPA.) | No. of Offers |
    Remark | Dual Offer | Campus On/OFF | Date of Joining

### These files are not tidy

The header sits on row 5, and *below and to the right of the data block* each
workbook carries signature lines, per-branch count pivots and salary summaries.
pandas cannot tell those from data, so `Type of Placement` contains ``'E&CS'``
and ``'6.25'``, and the visit-date column contains ``'(Rupali Mane)'`` and
``'Dy.(Placement Officer)'``.

Every row is therefore gated on the UID pattern. That gate is the whole
difference between 584 real 2026 offers and the 37 fabricated "students" named
``3.46``, ``AI&ML`` and ``10.2`` that the previous import created.

### Batch comes from the row, not the filename

The previous import passed the batch in as an argument and got it wrong,
filing all 584 batch-2026 offers under 2028 — including the companies. Here
each row's cohort is read from its own UID suffix, and a row whose suffix
disagrees with the file is reported rather than dropped or coerced.

### What has nowhere to go

`Stipend Offered` (189 values in the 2026 file) and `Campus On/OFF` have no
column on any model. They are counted in the report rather than smuggled into
an unrelated field; giving them a home is a schema change and out of scope.
"""

from __future__ import annotations

import datetime as dt

from placements.models import CompanyRegistration, Notice
from student.models import Student, StudentOffer

from . import normalize, sources, students


def _company_for(name, batch, offer_type, category, cache, report, *, dry_run=False):
    """``CompanyRegistration`` for (name, batch), creating it with its Notice.

    ``CompanyRegistration.notice`` is a non-null OneToOne, so a company cannot
    exist without one. The notice is a placeholder — these drives happened
    years ago and no announcement text survives.
    """
    key = (name.lower(), batch)
    if key in cache:
        return cache[key]

    company = CompanyRegistration.objects.filter(name=name, batch=batch).first()
    if company is None:
        if dry_run:
            report.companies_created += 1
            cache[key] = None
            return None
        notice = Notice.objects.create(
            subject=f"{name} — batch {batch}",
            date=dt.date.today(),
            intro="Imported from the historical placement register.",
            about=f"Employer category: {category or 'not recorded'}.",
            company_registration_link="https://tcetmumbai.in/",
            note="Backfilled record — no original notice text exists.",
            location="Mumbai",
            deadline=dt.date.today(),
        )
        company = CompanyRegistration.objects.create(
            name=name,
            batch=batch,
            min_tenth_marks="0",
            min_higher_secondary_marks="0",
            min_cgpa="0",
            accepted_kt=True,
            domain="IT",
            departments="All",
            is_aedp_or_pli=(offer_type == "AEDP_PLI"),
            is_aedp_or_ojt=(offer_type == "AEDP_OJT"),
            selected_departments=[],
            notice=notice,
        )
        report.companies_created += 1
        report.notices_created += 1

    cache[key] = company
    return company


def import_register(source, report, *, dry_run=False):
    frame = sources.load(source)
    report.files_processed.append(f"{source.name} [register, batch {source.batch}]")

    column = {
        "uid": sources.find_column(frame, "T&P(UID)", "T&P (UID)", "uid"),
        "branch": sources.find_column(frame, "Branch Div", "branch"),
        "name": sources.find_column(frame, "Student Name"),
        "visit": sources.find_column(frame, "Employer Visit and Result"),
        "category": sources.find_column(frame, "Employer Category"),
        "type": sources.find_column(frame, "Type of Placement"),
        "employer": sources.find_column(frame, "Employer  Name", "Employer Name"),
        "stipend": sources.find_column(frame, "Stipend Offered"),
        "salary": sources.find_column(frame, "Salary offered"),
        "remark": sources.find_column(frame, "Remark"),
        "campus": sources.find_column(frame, "Campus"),
        "joining": sources.find_column(frame, "Date of Joining"),
    }

    if not column["uid"] or not column["employer"]:
        report.error(
            f"{source.name}: could not locate the UID and/or Employer Name column"
        )
        return

    company_cache = {}
    seen_offers = set()
    stipends_dropped = 0
    campus_dropped = 0

    for position, row in frame.iterrows():
        excel_row = position + source.header_row + 2
        report.rows_read += 1

        uid_raw = row.get(column["uid"])

        # -- the gate ------------------------------------------------------
        if normalize.is_blank(uid_raw):
            continue  # summary/blank row, not worth reporting individually
        if not normalize.is_uid(uid_raw):
            report.reject(
                "not a student row (spreadsheet footer, pivot or summary cell)",
                source.name, excel_row, uid_raw,
            )
            continue

        uid = normalize.clean_text(uid_raw)
        row_batch = normalize.uid_batch(uid)

        if source.batch and row_batch != source.batch:
            report.anomaly(
                "UID suffix disagrees with the file's batch",
                f"{source.name} row {excel_row}: {uid} filed under {row_batch}, "
                f"file is the {source.batch} register",
            )

        employer = normalize.clean_text(row.get(column["employer"]))
        if not employer:
            report.reject("offer row with no employer", source.name, excel_row, uid)
            continue
        employer = employer[:255]

        # -- the student ---------------------------------------------------
        department = normalize.normalize_department(
            row.get(column["branch"]) if column["branch"] else None
        )
        student_fields = {
            "department": department,
            "division": normalize.split_division(department) if department else None,
            "batch": row_batch,
        }
        student, _created = students.upsert_student(
            uid, student_fields, report, source_kind="register", dry_run=dry_run
        )

        if student is None and not dry_run:
            continue
        if student is not None and student.user is None and not dry_run:
            # No roster covers this cohort, so the login has to be synthesised.
            user = students.sync_user(
                students.placeholder_email(uid),
                normalize.clean_name(row.get(column["name"])) if column["name"] else None,
                report,
            )
            students.attach_user(student, user, report, dry_run=dry_run)

        # -- the offer -----------------------------------------------------
        offer_type = normalize.normalize_offer_type(
            row.get(column["type"]) if column["type"] else None
        )
        role = normalize.offer_role_label(
            row.get(column["type"]) if column["type"] else None
        )
        joining = normalize.to_date(row.get(column["joining"])) if column["joining"] else None
        status = normalize.normalize_offer_status(
            row.get(column["remark"]) if column["remark"] else None, joining
        )
        offer_date = normalize.to_date(row.get(column["visit"])) if column["visit"] else None

        salary = normalize.to_float(row.get(column["salary"])) if column["salary"] else None
        if salary is None:
            # `StudentOffer.salary` is a non-null FloatField with no default.
            # One 2026 row reads 'As Per Industry Standard'.
            report.anomaly(
                "offer imported with no salary (stored as 0.0)",
                f"{source.name} row {excel_row}: {uid} / {employer}",
            )
            salary = 0.0

        if column["stipend"] and normalize.to_float(row.get(column["stipend"])) is not None:
            stipends_dropped += 1
        if column["campus"] and normalize.normalize_campus(row.get(column["campus"])):
            campus_dropped += 1

        # `unique_together = (student, company, role)`.
        dedupe_key = (uid, employer.lower(), role.lower())
        if dedupe_key in seen_offers:
            report.duplicates_skipped += 1
            report.anomaly(
                "duplicate offer row (same student, employer and scheme)",
                f"{source.name} row {excel_row}: {uid} / {employer} / {role}",
            )
            continue
        seen_offers.add(dedupe_key)

        company = _company_for(
            employer, row_batch, offer_type,
            normalize.clean_text(row.get(column["category"])) if column["category"] else None,
            company_cache, report, dry_run=dry_run,
        )
        if company is None:
            continue

        defaults = {
            "offer_type": offer_type,
            "status": status,
            "salary": salary,
            "is_aedp_pli": offer_type == "AEDP_PLI",
            "is_aedp_ojt": offer_type == "AEDP_OJT",
        }
        if offer_date:
            defaults["offer_date"] = offer_date

        if dry_run:
            report.offers_created += 1
            continue

        offer = StudentOffer.objects.filter(
            student=student, company=company, role=role
        ).first()
        if offer is None:
            StudentOffer.objects.create(
                student=student, company=company, role=role, **defaults
            )
            report.offers_created += 1
        else:
            changed = [k for k, v in defaults.items() if getattr(offer, k) != v]
            if changed:
                for key in changed:
                    setattr(offer, key, defaults[key])
                offer.save(update_fields=changed)
                report.offers_updated += 1

    if stipends_dropped:
        report.anomaly(
            "stipend values with no column to store them",
            f"{source.name}: {stipends_dropped} rows — no stipend field exists on "
            f"StudentOffer; adding one is a schema change (T-25 territory)",
        )
    if campus_dropped:
        report.anomaly(
            "on/off-campus flags with no column to store them",
            f"{source.name}: {campus_dropped} rows",
        )


def link_students_without_offers(report):
    """Report cohorts whose only members are placed students.

    Batch 2026 has no roster — the register is the only source — so every
    student in it holds an offer and the placement rate reads 100%. That is a
    property of the source data, not of the cohort, and any report built on it
    needs the caveat.
    """
    from django.db.models import Count

    rows = (
        Student.objects.values("batch")
        .annotate(
            total=Count("id", distinct=True),
            placed=Count("student_offers__student_id", distinct=True),
        )
        .order_by("batch")
    )
    for row in rows:
        if row["total"] and row["total"] == row["placed"]:
            report.anomaly(
                "cohort contains only placed students (no roster imported)",
                f"batch {row['batch']}: {row['total']} students, all with offers — "
                f"placement rate will read 100%",
            )
