from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = "__all__"


# class ProgramSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Program
#         fields = '__all__'
