from rest_framework import serializers
from .models import AttendanceData, BatchAttendance, AttendanceRecord,TrainingPerformance, TrainingPerformanceCategory
from student.models import Student
from django.db.models import Sum, Avg


class AttendanceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceData
        fields = "__all__"


class BatchAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchAttendance
        fields = "__all__"


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "program_name",
            "year",
            "num_sessions",
            "num_days",
            "dates",
            "file_headers",
            "student_data",
        ]


class TrainingPerformanceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingPerformanceCategory
        fields = ("category_name", "marks")


class TrainingPerformanceSerializer(serializers.ModelSerializer):

    categories = TrainingPerformanceCategorySerializer(many=True, read_only=True)
    total_marks = serializers.SerializerMethodField()
    average_marks = serializers.SerializerMethodField()

    class Meta:
        model = TrainingPerformance
        fields = (
            "training_type",
            "semester",
            "date",
            "total_marks",
            "average_marks",
            "categories",
        )

    def get_total_marks(self, obj):
        return obj.categories.aggregate(total=Sum("marks"))["total"] or 0

    def get_average_marks(self, obj):
        return obj.categories.aggregate(avg=Avg("marks"))["avg"] or 0


class StudentAnalyticsSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    department = serializers.CharField(read_only=True)

    performance_summary = TrainingPerformanceSerializer(
        many=True, read_only=True, source="training_performance"
    )
    attendance_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = (
            "uid",
            "name",
            "batch",
            "department",
            "attendance_summary",
            "performance_summary",
        )

    def get_name(self, obj):
        if obj.user:
            return obj.user.full_name or obj.user.username
        return "N/A"

    def get_attendance_summary(self, obj):
        attendance_map = self.context.get("attendance_map", {})
        stats = attendance_map.get(obj.uid)

        if not stats:
            return {
                "total_sessions": 0,
                "present_count": 0,
                "late_count": 0,
                "absent_count": 0,
                "attendance_percentage": 0,
            }

        total = stats.get("total_sessions", 0)
        present = stats.get("present_count", 0)
        late = stats.get("late_count", 0)
        absent = total - present
        percentage = (present / total) * 100 if total > 0 else 0

        return {
            "total_sessions": total,
            "present_count": present,
            "late_count": late,
            "absent_count": absent,
            "attendance_percentage": round(percentage, 2),
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get("request")
        if not request:
            return data

        semester = request.query_params.get("semester")
        if semester:
            performances = instance.trainingperformance_set.filter(semester=semester)
            data["performance_summary"] = TrainingPerformanceSerializer(
                performances, many=True, context=self.context
            ).data

        return data