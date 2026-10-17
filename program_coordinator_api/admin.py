from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    AttendanceData,
    BatchAttendance,
    AttendanceRecord,
    Program1,
    TrainingPerformance,
    TrainingPerformanceCategory,
)


@admin.register(AttendanceData)
class AttendanceDataAdmin(ModelAdmin):
    list_display = (
        "uid",
        "name",
        "program_name",
        "batch",
        "year",
        "session",
        "present",
        "late",
        "semester",
        "timestamp",
    )
    list_filter = ("program_name", "batch", "year", "session", "present", "late")
    search_fields = ("uid", "name", "program_name", "batch")


@admin.register(BatchAttendance)
class BatchAttendanceAdmin(ModelAdmin):
    list_display = (
        "batch",
        "program_name",
        "year",
        "session",
        "total_students",
        "total_present",
        "total_absent",
        "total_late",
    )
    list_filter = ("program_name", "batch", "year", "session")
    search_fields = ("batch", "program_name", "session")


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(ModelAdmin):
    list_display = (
        "program_name",
        "year",
        "semester",
        "phase",
        "num_sessions",
        "num_days",
    )
    list_filter = ("program_name", "year", "semester", "phase")
    search_fields = ("program_name", "year")


@admin.register(Program1)
class Program1Admin(ModelAdmin):
    list_display = (
        "UID",
        "Name",
        "Branch_Div",
        "Year",
        "program_name",
        "training_attendance",
        "training_performance",
    )
    list_filter = ("program_name", "Year", "Branch_Div")
    search_fields = ("UID", "Name", "program_name")


class TrainingPerformanceCategoryInline(admin.TabularInline):
    model = TrainingPerformanceCategory
    extra = 0


@admin.register(TrainingPerformance)
class TrainingPerformanceAdmin(ModelAdmin):
    list_display = (
        "student",
        "training_type",
        "semester",
        "date",
        "uploaded_by",
        "uploaded_at",
    )
    list_filter = ("training_type", "semester")
    search_fields = ("student__uid", "student__user__full_name", "training_type")
    inlines = [TrainingPerformanceCategoryInline]
