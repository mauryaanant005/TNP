from rest_framework import serializers
from .models import (
    InternshipRegistration,
    Offers,
    InternshipNotice,
    InternshipAcceptance,
    InternshipApplication,
    Skill,
    Role,
    Stipend,
)


class InternshipRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipRegistration
        fields = "__all__"


class OffersSerializer(serializers.ModelSerializer):
    company = InternshipRegistrationSerializer(
        read_only=True
    )  # Nested serialization for related company

    class Meta:
        model = Offers
        fields = "__all__"


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = "__all__"


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class StipendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stipend
        fields = "__all__"


class InternshipNoticeSerializer(serializers.ModelSerializer):
    company = InternshipRegistrationSerializer(
        read_only=True
    )  # Nested serialization for related company
    skills = SkillSerializer(
        many=True, read_only=True
    )  # Nested serialization for related skills
    roles = RoleSerializer(
        many=True, read_only=True
    )  # Nested serialization for related roles
    stipends = StipendSerializer(
        many=True, read_only=True
    )  # Nested serialization for related stipends

    class Meta:
        model = InternshipNotice
        fields = "__all__"


class InternshipApplicationSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=InternshipRegistration.objects.all()
    )

    class Meta:
        model = InternshipApplication
        fields = "__all__"


class InternshipAcceptanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipAcceptance
        fields = "__all__"

    def validate(self, data):
        # Validate internship type and total hours
        if data["start_date"].month in [12, 5]:
            if (
                data["total_hours"]
                > 8 * (data["completion_date"] - data["start_date"]).days
            ):
                raise serializers.ValidationError(
                    "Total hours exceed the limit for a full-time internship."
                )
        else:
            if (
                data["total_hours"]
                > 4 * (data["completion_date"] - data["start_date"]).days
            ):
                raise serializers.ValidationError(
                    "Daily hours should be less than 4 for a part-time internship."
                )
        return data


class InternshipDataSerializer(serializers.Serializer):
    branch_data = serializers.ListField(child=serializers.DictField())
    stipend_data = serializers.ListField(child=serializers.DictField())
    students_securing_internship_data = serializers.ListField(
        child=serializers.DictField()
    )
    stipend_per_branch = serializers.ListField(child=serializers.DictField())
    internship_opportunities_data = serializers.ListField(child=serializers.DictField())
    internship_bar_labels = serializers.ListField(child=serializers.CharField())
    internship_bar_data = serializers.ListField(child=serializers.IntegerField())
