from rest_framework import serializers
from student.serializers import (
    AcademicAttendanceSemesterSerializer,
    AcademicPerformanceSemesterSerializer,
    InternshipAcceptanceSerializer,
    StudentOfferSerializer,
    StudentPlacementAppliedCompanySerializer,
)
from base.serializers import UserSerializer
from student.models import Student
from program_coordinator_api.serializers import TrainingPerformanceSerializer


class DepartmentStudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    academic_performance = AcademicPerformanceSemesterSerializer(
        many=True, read_only=True
    )
    academic_attendance = AcademicAttendanceSemesterSerializer(
        many=True, read_only=True
    )
    offers = StudentOfferSerializer(many=True, read_only=True, source="student_offers")
    applications = StudentPlacementAppliedCompanySerializer(
        many=True, read_only=True, source="applied_companies"
    )
    training_performance = TrainingPerformanceSerializer(many=True, read_only=True)
    internship_acceptances = InternshipAcceptanceSerializer(
        many=True, read_only=True, source="internship_offer_acceptance"
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "uid",
            "department",
            "academic_year",
            "current_category",
            "is_dse_student",
            "division",
            "gender",
            "dob",
            "contact",
            "personal_email",
            "tenth_grade",
            "higher_secondary_grade",
            "card",
            "consent",
            "batch",
            "cgpa",
            "attendance",
            "is_kt",
            "is_blacklisted",
            "joined_company",
            "user",
            "academic_performance",
            "academic_attendance",
            "offers",
            "applications",
            "training_performance",
            "internship_acceptances",
        ]
