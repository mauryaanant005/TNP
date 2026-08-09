"""Machine-readable permission matrix (T-07 / T-08).

The human-readable spec is ``docs/PERMISSIONS.md``. This module is the same
thing in a form pytest can parametrise over. **They must be changed together.**

Each rule is (method, path, allowed_roles). Every role in ``ALL_ROLES`` that is
not in ``allowed_roles`` is expected to be denied, so a rule cannot silently
omit a role - adding a role to the enum forces you to think about every
endpoint.

``superuser`` is allowed everywhere and is asserted separately.
"""

# Roles as they appear in base.models.User.USER_ROLE_TYPE, plus "anonymous".
ALL_ROLES = (
    "anonymous",
    "student",
    "faculty",
    "program_coordinator",
    "department_coordinator",
    "training_officer",
    "placement_officer",
    "internship_officer",
    "staff",
    "principal",
)

AUTHENTICATED_ROLES = tuple(r for r in ALL_ROLES if r != "anonymous")

# Placeholders. These identifiers do not need to exist: an authorisation check
# runs before the object lookup, so a denied caller gets 403 and an allowed
# caller gets 404 - both of which the assertion distinguishes correctly.
COMPANY_ID = "1"
BATCH = "2025"
UID = "0001-CMPN001-25"
TASK_ID = "00000000-0000-0000-0000-000000000000"

TRAINING_ROLES = ("faculty", "program_coordinator", "training_officer")
PLACEMENT_DRIVE_ROLES = ("staff", "placement_officer")
INTERNSHIP_ROLES = ("internship_officer", "staff")
ANALYTICS_ROLES = (
    "faculty",
    "program_coordinator",
    "department_coordinator",
    "training_officer",
    "principal",
)

# (method, path, allowed_roles)
PERMISSION_MATRIX = [
    # --- shared -----------------------------------------------------------
    ("GET", "/api/health/", ALL_ROLES),
    ("GET", "/api/", AUTHENTICATED_ROLES),
    ("POST", "/api/logout/", AUTHENTICATED_ROLES),

    # --- notifications ----------------------------------------------------
    ("GET", "/api/notifications/", AUTHENTICATED_ROLES),
    ("GET", "/api/notifications/unread-count/", AUTHENTICATED_ROLES),
    ("POST", "/api/notifications/", tuple(r for r in AUTHENTICATED_ROLES if r != "student")),

    # --- student self-service --------------------------------------------
    ("GET", "/api/student/info/", ("student",)),
    ("GET", "/api/student/resume/", ("student",)),
    ("GET", "/api/student/attendance-data/", ("student",)),
    ("GET", "/api/student/training-performance/", ("student",)),
    ("GET", "/api/student/placement-card/", ("student",)),
    ("GET", "/api/student/internships/", ("student",)),
    ("POST", "/api/student/company/register", ("student",)),

    # --- placement drives (/api/staff/) -----------------------------------
    # Reads stay open: a student must see eligibility criteria before applying.
    ("GET", f"/api/staff/placement/company/{COMPANY_ID}/", AUTHENTICATED_ROLES),
    ("GET", f"/api/staff/placement/companies/batch/{BATCH}/", AUTHENTICATED_ROLES),
    ("GET", "/api/staff/companies/batches/", AUTHENTICATED_ROLES),
    # Writes are the T&P office's.
    ("POST", "/api/staff/placement/company/", PLACEMENT_DRIVE_ROLES),
    ("PATCH", f"/api/staff/placement/company/{COMPANY_ID}/", PLACEMENT_DRIVE_ROLES),
    ("DELETE", f"/api/staff/placement/company/{COMPANY_ID}/", PLACEMENT_DRIVE_ROLES),
    ("POST", f"/api/staff/placement/company/send_notifications/{COMPANY_ID}/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/company/{COMPANY_ID}/interested-students/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/company/{COMPANY_ID}/not-interested-students/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/company/{COMPANY_ID}/eligible-not-registered/", PLACEMENT_DRIVE_ROLES),
    ("POST", "/api/staff/company/bulk-update-progress/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/company/{COMPANY_ID}/trigger-excel-export/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/company/{COMPANY_ID}/trigger-resume-export/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/task-status/{TASK_ID}/", PLACEMENT_DRIVE_ROLES),
    ("GET", f"/api/staff/update/student/{UID}/", PLACEMENT_DRIVE_ROLES),
    ("POST", "/api/staff/category_update/", PLACEMENT_DRIVE_ROLES),

    # --- placement reporting ----------------------------------------------
    ("GET", "/api/placement_officer/consent/", ("placement_officer", "principal")),
    ("GET", "/api/placement_officer/filter/CMPN/", ("placement_officer", "principal")),
    ("GET", "/api/placement_officer/unique-departments/", ("placement_officer", "principal")),
    ("GET", "/api/placement_officer/get_category_data/", ("placement_officer", "principal")),
    ("GET", "/api/placement_officer/get_category_data_by_department/CMPN/", ("placement_officer", "principal")),
    ("GET", f"/api/placement_officer/get_data_by_year/{BATCH}/", ("placement_officer", "principal")),
    ("GET", f"/api/placement_officer/dashboard/{BATCH}/", ("placement_officer", "principal")),
    ("GET", f"/api/placement_officer/branch_wise_report/{BATCH}/", ("placement_officer", "principal")),
    ("GET", f"/api/placement_officer/student_detail_report/{BATCH}/", ("placement_officer", "principal")),
    # Routed for the first time in T-19: the views and the frontend pages both
    # existed, only the URL entry was missing, so all three pages 404'd.
    ("POST", "/api/placement_officer/category-rules/create/", ("placement_officer", "principal")),
    ("GET", "/api/placement_officer/category-rules/list/", ("placement_officer", "principal")),
    ("GET", f"/api/placement_officer/students/by-category/Category%201/{BATCH}/",
     ("placement_officer", "principal")),

    # --- training ---------------------------------------------------------
    ("GET", "/api/program_coordinator/training-performance/template/Technical/", TRAINING_ROLES),
    ("POST", "/api/program_coordinator/training-performance/upload/Technical/",
     ("program_coordinator", "training_officer")),
    ("GET", "/api/program_coordinator/attendance/attendance_data/",
     ("program_coordinator", "training_officer")),
    ("POST", "/api/program_coordinator/save-branch-attendance/batch_attendance/",
     ("program_coordinator", "training_officer")),
    ("POST", "/api/program_coordinator/update-attendance/attendance_data/",
     ("program_coordinator", "training_officer")),
    ("POST", "/api/program_coordinator/create-attendance-record/", ("faculty", "program_coordinator")),
    ("GET", "/api/program_coordinator/avg-data/attendance_data/", ANALYTICS_ROLES),
    ("GET", "/api/program_coordinator/student-analytics/", ANALYTICS_ROLES),
    ("GET", "/api/program_coordinator/aggregate-analytics/", ANALYTICS_ROLES),
    ("GET", "/api/faculty_coordinator/data", ("faculty", "program_coordinator")),
    ("GET", "/api/faculty_coordinator/attendance", ("faculty", "program_coordinator")),
    ("POST", "/api/faculty_coordinator/save-attendance", ("faculty", "program_coordinator")),
    ("POST", "/api/faculty_coordinator/reset-attendance", ("faculty", "program_coordinator")),
    # Finding #20: no role check at all today - a student gets college-wide
    # training aggregates.
    ("GET", "/api/training_officer/get-avg-data/attendance_data/", ("training_officer", "principal")),

    # --- department -------------------------------------------------------
    ("GET", "/api/department_coordinator/student-data/", ("department_coordinator", "faculty")),
    ("GET", "/api/department_coordinator/dashboard-summary/", ("department_coordinator", "faculty")),
    ("POST", "/api/department_coordinator/attendance/upload-attendance/", ("department_coordinator", "faculty")),
    ("POST", "/api/department_coordinator/attendance/upload-performance/", ("department_coordinator", "faculty")),
    ("POST", "/api/department_coordinator/upload-inhouse-internship/", ("department_coordinator", "faculty")),

    # --- internships ------------------------------------------------------
    ("GET", f"/api/internship/company/{TASK_ID}", AUTHENTICATED_ROLES),
    ("POST", "/api/internship/company/register/", INTERNSHIP_ROLES),
    ("GET", "/api/internship/company/", INTERNSHIP_ROLES),
    ("POST", f"/api/internship/job_application/create/{TASK_ID}", ("student",)),
    ("GET", "/api/internship/jobs/verify/", INTERNSHIP_ROLES),
    ("POST", "/api/internship/jobs/verify/selected/", INTERNSHIP_ROLES),
    ("GET", "/api/internship/jobs/reports/", INTERNSHIP_ROLES),
    ("GET", "/api/internship/jobs/download-report/", INTERNSHIP_ROLES),
]


def flattened():
    """Yield one (role, method, path, expected) case per matrix cell.

    ``expected`` is "allow" or "deny" - see docs/PERMISSIONS.md, "Reading the
    tables", for why this is not an exact status code.
    """
    for method, path, allowed in PERMISSION_MATRIX:
        for role in ALL_ROLES:
            yield role, method, path, "allow" if role in allowed else "deny"
