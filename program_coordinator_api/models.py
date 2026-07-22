from django.db import models
from django.conf import settings
from student.models import SEM_OPTIONS,Student


# Model to store attendance data for a student
class AttendanceData(models.Model):
    batch = models.CharField(max_length=100)
    late = models.CharField(max_length=100, default="Late")
    name = models.CharField(max_length=100)
    present = models.CharField(max_length=100, default="Present")
    program_name = models.CharField(max_length=100)
    session = models.CharField(max_length=100)
    timestamp = models.DateTimeField()
    uid = models.CharField(max_length=100)
    year = models.CharField(max_length=100)
    semester = models.CharField(
        max_length=100, default="SEMESTER 1", choices=SEM_OPTIONS
    )

    class Meta:
        db_table = "attendance_data"

    def __str__(self):
        return f"{self.batch} - {self.session}"


# Model to store the overall attendance statistics for a batch/session
class BatchAttendance(models.Model):
    batch = models.CharField(max_length=100)
    session = models.CharField(max_length=100)
    total_students = models.IntegerField()
    total_present = models.IntegerField()
    total_absent = models.IntegerField()
    total_late = models.IntegerField()
    program_name = models.CharField(max_length=100)
    year = models.CharField(max_length=100)

    class Meta:
        db_table = "batch_attendance"
        unique_together = (
            "batch",
            "session",
            "program_name",
            "year",
        )  # To handle duplicate entries

    def __str__(self):
        return f"{self.batch} - {self.session} - {self.program_name}"


# Model to store attendance and performance data for a program/branch/division
class Program1(models.Model):
    UID = models.CharField(max_length=100, default="20")
    Name = models.CharField(max_length=100, default="Name")

    Branch_Div = models.CharField(max_length=100)
    Year = models.IntegerField()
    training_attendance = models.FloatField()
    training_performance = models.FloatField()
    semester = models.CharField(
        max_length=100, choices=SEM_OPTIONS, default="SEMESTER 1"
    )
    program_name = models.CharField(max_length=100, default="ACT_APTITUDE")

    def __str__(self):
        return self.Branch_Div

    class Meta:
        db_table = "program1"


# Revised model to store simple attendance records (student presence/absence) for a session
class SimpleAttendanceData(models.Model):
    uid = models.IntegerField()
    name = models.CharField(max_length=255)
    batch = models.CharField(max_length=255)
    session = models.CharField(max_length=255)
    present = models.CharField(max_length=10)  # 'Present' or 'Absent'

    def __str__(self):
        return f"{self.uid} - {self.name}"


# Model to store comprehensive attendance record for a program/year, including multiple sessions
class AttendanceRecord(models.Model):
    program_name = models.CharField(max_length=100)
    year = models.CharField(max_length=10)
    num_sessions = models.IntegerField()
    num_days = models.IntegerField()
    dates = models.JSONField()  # Stores a list of dates
    file_headers = models.JSONField(default=list)  # Default empty list
    student_data = models.JSONField(default=list)  # Default empty list
    semester = models.CharField(
        max_length=100, choices=SEM_OPTIONS, default="SEMESTER 1"
    )
    phase = models.CharField(
        max_length=100, choices=[('Phase 1', 'Phase 1'), ('Phase 2', 'Phase 2'), ('Phase 3', 'Phase 3')], default="Phase 1"
    )

    class Meta:
        db_table = "attendance_attendancerecord"

    def __str__(self):
        return f"Attendance record for {self.program_name} - {self.year}"

class TrainingPerformance(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE,null=True,related_name="training_performance")
    semester = models.CharField(
        max_length=100, choices=SEM_OPTIONS, null=True, blank=True
    )
    training_type = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField(null=True, blank=True)
    class Meta:
        db_table = "training_performance"

    def __str__(self):
        return f"{self.student} - {self.training_type}"


class TrainingPerformanceCategory(models.Model):
    """
    Holds marks for each subcategory (Arithmetic, OS, etc.)
    """
    performance = models.ForeignKey(
        TrainingPerformance, on_delete=models.CASCADE, related_name="categories"
    )
    category_name = models.CharField(max_length=100)
    marks = models.FloatField()

    class Meta:
        db_table = "training_performance_category"
        unique_together = ("performance", "category_name")

    def __str__(self):
        return f"{self.performance.uid} - {self.category_name}: {self.marks}"