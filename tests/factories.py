"""Test factories (T-06).

Every value here is synthetic. Never seed a test from a real spreadsheet, a
production dump, or a real UID - see rule 4 in ``docs/AGENTS_PROMPT.md``.
"""

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from base.models import FacultyResponsibility, User
from internship_api.models import InternshipRegistration
from program_coordinator_api.models import AttendanceData, TrainingPerformance
from staff.models import CompanyRegistration, JobOffer, Notice
from student.models import Student, StudentOffer


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.test")
    full_name = factory.Sequence(lambda n: f"Test User {n}")
    role = "student"
    is_staff = False
    is_superuser = False

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Go through the manager rather than model_class(...) so password
        # hashing and the manager's own logic are exercised the same way the
        # application exercises them.
        password = kwargs.pop("password", "test-password-1234")
        if kwargs.get("is_superuser"):
            return model_class.objects.create_superuser(password=password, **kwargs)
        return model_class.objects.create_user(password=password, **kwargs)


class SuperuserFactory(UserFactory):
    role = "system_admin"
    is_staff = True
    is_superuser = True


class FacultyResponsibilityFactory(DjangoModelFactory):
    class Meta:
        model = FacultyResponsibility

    user = factory.SubFactory(UserFactory, role="faculty")
    department = "CMPN"
    program = "ACT_Technical"


class StudentFactory(DjangoModelFactory):
    class Meta:
        model = Student
        django_get_or_create = ("uid",)

    user = factory.SubFactory(UserFactory, role="student")
    # Student.save() derives batch from the two-digit UID suffix, so the suffix
    # here is load-bearing - see Student.save().
    uid = factory.Sequence(lambda n: f"{n:04d}-CMPN{n:03d}-25")
    department = "CMPN"
    academic_year = "BE"
    division = "A"
    batch = "2025"
    cgpa = 8.0
    attendance = 85.0
    tenth_grade = 85.0
    higher_secondary_grade = 80.0
    current_category = "Category 1"
    consent = "placement"
    is_kt = False
    is_blacklisted = False


class NoticeFactory(DjangoModelFactory):
    class Meta:
        model = Notice

    subject = factory.Sequence(lambda n: f"Notice {n}")
    date = "2026-01-01"
    intro = "intro"
    about = "about"
    company_registration_link = "https://example.test/register"
    location = "Mumbai"
    deadline = "2026-02-01"


class CompanyRegistrationFactory(DjangoModelFactory):
    class Meta:
        model = CompanyRegistration

    name = factory.Sequence(lambda n: f"Company {n}")
    batch = "2025"
    # Stored as CharField today (audit §6.2); T-25 turns these into Decimal.
    min_tenth_marks = "60"
    min_higher_secondary_marks = "60"
    min_cgpa = "6.0"
    accepted_kt = False
    domain = "it"
    departments = "CMPN"
    selected_departments = factory.List(["CMPN"])
    notice = factory.SubFactory(NoticeFactory)


class JobOfferFactory(DjangoModelFactory):
    class Meta:
        model = JobOffer

    form = factory.SubFactory(CompanyRegistrationFactory)
    role = factory.Sequence(lambda n: f"Engineer {n}")
    # Salary is in LPA here, not rupees - is_student_eligible() compares it
    # against the literals 5 and 10. That unit ambiguity is real and is what
    # the characterisation tests pin.
    salary = "8"
    skills = "python"


class StudentOfferFactory(DjangoModelFactory):
    class Meta:
        model = StudentOffer

    student = factory.SubFactory(StudentFactory)
    company = factory.SubFactory(CompanyRegistrationFactory)
    job_offer = factory.SubFactory(JobOfferFactory)
    offer_type = "PLACEMENT"
    status = "offered"
    salary = 8.0
    role = "Engineer"


class AttendanceDataFactory(DjangoModelFactory):
    class Meta:
        model = AttendanceData

    batch = "2025"
    name = "Test Student"
    present = "Present"
    late = "Not Late"
    program_name = "ACT_Technical"
    session = factory.Sequence(lambda n: f"2026-01-01 - Session {n}")
    timestamp = factory.LazyFunction(timezone.now)
    uid = factory.Sequence(lambda n: f"{n:04d}-CMPN{n:03d}-25")
    year = "2025"
    semester = "Semester 1"


class TrainingPerformanceFactory(DjangoModelFactory):
    class Meta:
        model = TrainingPerformance

    student = factory.SubFactory(StudentFactory)
    semester = "Semester 1"
    training_type = "Technical"


class InternshipRegistrationFactory(DjangoModelFactory):
    class Meta:
        model = InternshipRegistration

    name = factory.Sequence(lambda n: f"Internship Co {n}")
    min_cgpa = 6.0
    min_attendance = 75.0
    domain = "it"
    departments = "all"
    batch = "2026"
