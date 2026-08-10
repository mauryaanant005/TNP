"""The 18-column student roster.

    sr no | uid | department | roll no | full_name | gender | dob | contact |
    personal_email | email | consent | role | password | academic_year |
    batch | tenth_grade | higher_secondary_grade | division

Produced for batches 2027 (``Batch_2027_Extracted_Output.xlsx``, 1105 rows) and
2028 (``2028 Batch.xlsx``, 1416 rows). This is the only source of personal
details in the whole import — the placement registers carry a name and nothing
else.

Note the ``password`` column: every row says ``tcet@1234``. It is ignored.
Passwords come from ``DEFAULT_SEED_PASSWORD`` and are hashed on the way in;
importing a plaintext column verbatim is how you end up with an unhashed
password field, which the entrypoint then has to repair on every boot.
"""

from __future__ import annotations

from . import normalize, sources, students


def import_roster(source, report, *, dry_run=False):
    frame = sources.load(source)
    report.files_processed.append(f"{source.name} [roster, batch {source.batch}]")

    column = {
        "uid": sources.find_column(frame, "uid"),
        "department": sources.find_column(frame, "department", "branch"),
        "full_name": sources.find_column(frame, "full_name", "student name", "name"),
        "gender": sources.find_column(frame, "gender"),
        "dob": sources.find_column(frame, "dob", "date of birth"),
        "contact": sources.find_column(frame, "contact", "mobile", "phone"),
        "personal_email": sources.find_column(frame, "personal_email"),
        "email": sources.find_column(frame, "email"),
        "consent": sources.find_column(frame, "consent"),
        "academic_year": sources.find_column(frame, "academic_year"),
        "tenth": sources.find_column(frame, "tenth_grade", "10th"),
        "hsc": sources.find_column(frame, "higher_secondary_grade", "12th"),
        "division": sources.find_column(frame, "division"),
    }

    missing = [k for k in ("uid", "email", "full_name") if not column[k]]
    if missing:
        report.error(f"{source.name}: roster is missing required column(s) {missing}")
        return

    seen = set()

    for position, row in frame.iterrows():
        # +2: pandas is 0-based and the header occupies one line, so this is
        # the row number you would see in Excel.
        excel_row = position + source.header_row + 2
        report.rows_read += 1

        uid = normalize.clean_text(row.get(column["uid"]))
        if not uid:
            report.reject("blank UID", source.name, excel_row)
            continue
        if not normalize.is_uid(uid):
            report.reject("UID not in T&P format", source.name, excel_row, uid)
            continue

        row_batch = normalize.uid_batch(uid)
        if source.batch and row_batch != source.batch:
            # Imported anyway — Student.save() files it by UID regardless — but
            # surfaced, because it means either the UID or the file is wrong.
            report.anomaly(
                "UID suffix disagrees with the file's batch",
                f"{source.name} row {excel_row}: {uid} -> batch {row_batch}, "
                f"file says {source.batch}",
            )

        if uid in seen:
            report.duplicates_skipped += 1
            report.anomaly("duplicate UID within the file", f"{source.name}: {uid}")
            continue
        seen.add(uid)

        email = normalize.clean_text(row.get(column["email"]))
        if not email or "@" not in email:
            report.reject("missing or malformed email", source.name, excel_row, email)
            continue

        department = normalize.normalize_department(row.get(column["department"]))
        division = normalize.split_division(
            department, row.get(column["division"]) if column["division"] else None
        )

        fields = {
            "department": department,
            "division": division,
            "academic_year": normalize.normalize_academic_year(
                row.get(column["academic_year"]) if column["academic_year"] else None
            ),
            "gender": normalize.normalize_gender(
                row.get(column["gender"]) if column["gender"] else None
            ),
            "dob": normalize.to_dob(row.get(column["dob"])) if column["dob"] else None,
            "contact": normalize.to_contact(
                row.get(column["contact"]) if column["contact"] else None
            ),
            "personal_email": normalize.clean_text(
                row.get(column["personal_email"]) if column["personal_email"] else None
            ),
            "consent": normalize.normalize_consent(
                row.get(column["consent"]) if column["consent"] else None
            ),
            "tenth_grade": normalize.to_float(
                row.get(column["tenth"]) if column["tenth"] else None
            ),
            "higher_secondary_grade": normalize.to_float(
                row.get(column["hsc"]) if column["hsc"] else None
            ),
            "batch": row_batch,
        }

        full_name = normalize.clean_name(row.get(column["full_name"]))

        student, _created = students.upsert_student(
            uid, fields, report, source_kind="roster", dry_run=dry_run
        )
        user = students.sync_user(
            email, full_name, report, existing=student.user if student else None
        )
        students.attach_user(student, user, report, dry_run=dry_run)
