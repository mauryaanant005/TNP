from rest_framework import serializers
from .models import CategoryRule
from student.models import Student
from staff.utils import is_student_eligible
class CategoryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryRule
        fields = [
            'category',
            'batch',
            'minimum_academic_attendance',
            'minimum_academic_performance',
            'minimum_training_attendance',
            'minimum_training_performance',
        ]


def get_safe_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

class StudentDetailReportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    all_offers_list = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'uid', 'student_name', 'department', 'gender',
            'tenth_grade', 'higher_secondary_grade', 'cgpa',
            'is_kt',
            'all_offers_list',
        ]

    def get_student_name(self, student_obj):
        if student_obj.user:
            return f"{student_obj.user.full_name}"
        return ""

    def get_all_offers_list(self, student_obj):
        offers = student_obj.student_offers.all().select_related('company')
        return [offer.company.name for offer in offers]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        companies = self.context.get('companies', [])
        progress_map = {
            p.application.company_id: p
            for p in instance.all_progress
        }
        offer_map = {
            o.company_id: o
            for o in instance.student_offers.all()
        }
        for company in companies:
            comp_key = f"company_{company.id}"
            progress = progress_map.get(company.id)
            offer = offer_map.get(company.id)
            is_eligible = is_student_eligible(instance, company)
            data[f"{comp_key}_eligible"] = is_eligible or (offer is not None)
            data[f"{comp_key}_registered"] = progress.registered if progress else False
            data[f"{comp_key}_aptitude_test"] = progress.aptitude_test if progress else False
            data[f"{comp_key}_coding_test"] = progress.coding_test if progress else False
            data[f"{comp_key}_technical_interview"] = progress.technical_interview if progress else False
            data[f"{comp_key}_gd"] = progress.gd if progress else False
            data[f"{comp_key}_hr_interview"] = progress.hr_interview if progress else False
            data[f"{comp_key}_selected"] = (offer is not None)
        return data