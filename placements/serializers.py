"""Serializers for placement drives and reports (T-19).

Ported verbatim from `staff/serializers.py` and `placement_officer/
serializers.py`. Field lists are unchanged — they are the API contract, and
`client_app/src/lib/generated/` is built from them, so any change here shows up
as a CI diff (T-22).
"""

from rest_framework import serializers

from placements.models import CategoryRule, CompanyRegistration, JobOffer, Notice
from placements.services import is_student_eligible
from student.models import (
    PlacementCompanyProgress,
    Student,
    StudentPlacementAppliedCompany,
)


class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = "__all__"


class JobOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOffer
        fields = ["role", "salary", "skills"]


class FormDataSerializer(serializers.ModelSerializer):
    """A drive: the company, its notice and its roles, written in one request."""

    notice = NoticeSerializer()
    job_offers = JobOfferSerializer(many=True)

    class Meta:
        model = CompanyRegistration
        fields = [
            "id",
            "name",
            "batch",
            "min_tenth_marks",
            "min_higher_secondary_marks",
            "min_cgpa",
            "accepted_kt",
            "domain",
            "departments",
            "is_aedp_or_pli",
            "is_aedp_or_ojt",
            "selected_departments",
            "notice",
            "job_offers",
        ]
        extra_kwargs = {"id": {"read_only": True}}

    def create(self, validated_data):
        notice_data = validated_data.pop("notice")
        job_offers_data = validated_data.pop("job_offers")
        notice = Notice.objects.create(**notice_data)
        form = CompanyRegistration.objects.create(notice=notice, **validated_data)
        for job_data in job_offers_data:
            JobOffer.objects.create(form=form, **job_data)
        return form

    def update(self, instance, validated_data):
        notice_data = validated_data.pop("notice", None)
        if notice_data:
            for attr, value in notice_data.items():
                setattr(instance.notice, attr, value)
            instance.notice.save()

        job_offers_data = validated_data.pop("job_offers", None)
        if job_offers_data is not None:
            # Replace rather than merge: the frontend sends the full set.
            instance.job_offers.all().delete()
            for job_data in job_offers_data:
                JobOffer.objects.create(form=instance, **job_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class BasicStudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Student
        fields = [
            "email", "full_name", "role",
            "id", "uid", "department", "academic_year", "current_category",
            "is_dse_student", "gender", "dob", "contact", "personal_email",
            "tenth_grade", "higher_secondary_grade", "card", "consent",
            "batch", "cgpa", "attendance", "is_kt", "is_blacklisted",
            "joined_company",
        ]


class PlacementCompanyProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementCompanyProgress
        exclude = ["application"]


class InterestedStudentApplicationSerializer(serializers.ModelSerializer):
    student = BasicStudentSerializer(read_only=True)
    progress = PlacementCompanyProgressSerializer(source="application", read_only=True)
    application_id = serializers.UUIDField(source="id")

    class Meta:
        model = StudentPlacementAppliedCompany
        fields = ["application_id", "student", "progress"]


class NotInterestedStudentApplicationSerializer(serializers.ModelSerializer):
    student = BasicStudentSerializer(read_only=True)

    class Meta:
        model = StudentPlacementAppliedCompany
        fields = ["id", "student", "not_interested_reason"]


class CategoryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryRule
        fields = [
            "category",
            "batch",
            "minimum_academic_attendance",
            "minimum_academic_performance",
            "minimum_training_attendance",
            "minimum_training_performance",
        ]


class StudentDetailReportSerializer(serializers.ModelSerializer):
    """One row per student, with a column block per company on the drive.

    Requires `attach_progress()` to have run over the page first — it reads
    `instance.all_progress`.
    """

    student_name = serializers.SerializerMethodField()
    all_offers_list = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "uid", "student_name", "department", "gender",
            "tenth_grade", "higher_secondary_grade", "cgpa",
            "is_kt",
            "all_offers_list",
        ]

    def get_student_name(self, student):
        return student.user.full_name if student.user else ""

    def get_all_offers_list(self, student):
        return [offer.company.name for offer in student.student_offers.all()]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        companies = self.context.get("companies", [])

        progress_by_company = {
            p.application.company_id: p for p in instance.all_progress
        }
        offer_by_company = {o.company_id: o for o in instance.student_offers.all()}

        for company in companies:
            key = f"company_{company.id}"
            progress = progress_by_company.get(company.id)
            offer = offer_by_company.get(company.id)

            # An existing offer implies eligibility even if the rules would say
            # otherwise today - the student demonstrably was eligible when they
            # applied.
            data[f"{key}_eligible"] = is_student_eligible(instance, company) or (
                offer is not None
            )
            for field in [
                "registered", "aptitude_test", "coding_test",
                "technical_interview", "gd", "hr_interview",
            ]:
                data[f"{key}_{field}"] = getattr(progress, field) if progress else False
            data[f"{key}_selected"] = offer is not None

        return data
