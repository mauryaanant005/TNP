from django.db import models
from uuid import uuid4
from student.models import Student

# Create your models here.


class InternshipRegistration(models.Model):
    DOMAIN_TYPES = [("core", "core"), ("it", "it")]
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=100)
    min_tenth_marks = models.FloatField(null=True, blank=True)
    min_higher_secondary_marks = models.FloatField(null=True, blank=True)
    min_cgpa = models.FloatField()
    min_attendance = models.FloatField()
    is_kt = models.BooleanField(default=False)
    is_backlog = models.BooleanField(
        default=False
    )  # Corrected field name to `is_backlog`
    domain = models.CharField(choices=DOMAIN_TYPES, max_length=40)
    departments = models.TextField(
        default="all"
    )  # Changed `Departments` to lowercase for consistency
    created_at = models.DateTimeField(auto_now=True)
    batch = models.CharField(max_length=100, default="2026")

    def __str__(self):
        return f"{self.name}-{self.id}"


class Offers(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    type = models.CharField(max_length=100)
    stipend = models.FloatField()
    position = models.CharField(max_length=100)
    company = models.ForeignKey(
        InternshipRegistration, on_delete=models.CASCADE, related_name="company_offers"
    )

    def __str__(self):
        return f"{self.position} at {self.company.name}"


class InternshipNotice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    sr_no = models.TextField(default="")
    to = models.TextField(default="")
    subject = models.TextField(default="")
    date = models.TextField(default="")
    intro = models.TextField(default="")
    eligibility_criteria = models.TextField(default="")
    about = models.TextField(default="")
    location = models.TextField(default="")
    documents_to_carry = models.TextField(default="")
    walk_in_interview = models.TextField(default="")
    company_registration_link = models.TextField(default="")
    note = models.TextField(default="")
    from_field = models.TextField(
        default=""
    )  # Changed name to avoid conflict with `from` keyword
    from_designation = models.TextField(default="")
    company = models.OneToOneField(
        InternshipRegistration,
        on_delete=models.CASCADE,
        related_name="placement_notice",
    )

    def __str__(self):
        return f"Notice for {self.company.name}"


class Skill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=100)
    internship_notice = models.ForeignKey(
        InternshipNotice,
        on_delete=models.CASCADE,
        related_name="skills",
    )

    def __str__(self):
        return self.name


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=100)
    internship_notice = models.ForeignKey(
        InternshipNotice,
        on_delete=models.CASCADE,
        related_name="roles",
    )

    def __str__(self):
        return self.title


class Stipend(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    internship_notice = models.ForeignKey(
        InternshipNotice,
        on_delete=models.CASCADE,
        related_name="stipends",
    )

    def __str__(self):
        return f"{self.amount}"


class InternshipApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    student = models.CharField(max_length=100)
    company = models.ForeignKey(
        InternshipRegistration,
        on_delete=models.DO_NOTHING,
        related_name="company_job_applications",
    )
    attendance = models.BooleanField(default=False)
    hr_round = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"Application by {self.student} for {self.company.name}"


class InternshipAcceptance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    student = models.ForeignKey(
        to=Student,
        on_delete=models.DO_NOTHING,
        related_name="internship_offer_acceptance",
        null=True,
    )
    year = models.CharField(max_length=100, default="FE")
    company_name = models.CharField(max_length=100, null=True, blank=True)
    offer_letter = models.FileField(upload_to="offer_letters/")
    type = models.CharField(
        max_length=100,
    )
    salary = models.FloatField(default=0)
    is_verified = models.BooleanField(default=False)
    domain_name = models.CharField(max_length=100, default="")
    total_hours = models.PositiveIntegerField(default=0)
    start_date = models.DateField()
    completion_date = models.DateField()
    offer_type = models.CharField(max_length=100, default="in_house")

    def save(self, *args, **kwargs):
        # Constraint: Full-time for December and May; part-time for other months
        if self.start_date.month in [12, 5]:
            self.type = "Full-time"
            if self.total_hours > 8 * (self.completion_date - self.start_date).days:
                raise ValueError(
                    "Total hours exceed the limit for a full-time internship."
                )
        else:
            self.type = "Part-time"
            if self.total_hours > 8 * (self.completion_date - self.start_date).days:
                raise ValueError(
                    "Daily hours should be less than 8 for a part-time internship."
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.company_name} - {self.type}"
