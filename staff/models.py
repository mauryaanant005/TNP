from django.db import models


class Notice(models.Model):
    subject = models.CharField(max_length=255)
    date = models.DateField()
    intro = models.TextField()
    about = models.TextField()
    company_registration_link = models.URLField()
    note = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    deadline = models.DateField()

    def __str__(self):
        return self.subject


class CompanyRegistration(models.Model):
    name = models.CharField(max_length=255)
    batch = models.CharField(max_length=50)

    min_tenth_marks = models.CharField(max_length=10)
    min_higher_secondary_marks = models.CharField(max_length=10)
    min_cgpa = models.CharField(max_length=10)
    accepted_kt = models.BooleanField(default=False)
    domain = models.CharField(max_length=100)
    departments = models.CharField(max_length=255)

    is_aedp_or_pli = models.BooleanField(default=False)
    is_aedp_or_ojt = models.BooleanField(default=False)
    selected_departments = models.JSONField(default=list)
    notice = models.OneToOneField(Notice, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "batch"], name="unique_name_batch")
        ]

    def __str__(self):
        return f"{self.name} - {self.batch}"


class JobOffer(models.Model):
    form = models.ForeignKey(
        CompanyRegistration, related_name="job_offers", on_delete=models.CASCADE
    )
    role = models.CharField(max_length=255)
    salary = models.CharField(max_length=50)
    skills = models.TextField()  # comma-separated or JSON if structured

    def __str__(self):
        return f"{self.role} ({self.form.name}, {self.form.batch})"
