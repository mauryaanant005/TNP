from django.urls import path
from .views import (
    AttendanceViewSet,
    DepartmentStudentDataView,
    upload_inhouse_internship,
    DepartmentDashboardSummaryView
)

urlpatterns = [
    path(
        "attendance/upload-attendance/",
        AttendanceViewSet.as_view({"post": "upload_attendance"}),
        name="upload-attendance",
    ),
    path(
        "attendance/upload-performance/",
        AttendanceViewSet.as_view({"post": "upload_performance"}),
        name="upload-performance",
    ),
    path(
        "student-data/",
        DepartmentStudentDataView.as_view(),
        name="department-student-data",
    ),
    path(
        "upload-inhouse-internship/",
        upload_inhouse_internship,
        name="upload-inhouse-internship",
    ),
    path(
        "dashboard-summary/",
        DepartmentDashboardSummaryView.as_view(),
        name="get-attendance-summary",
    ),
]
