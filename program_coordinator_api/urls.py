from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path(
        "training-performance/template/<str:training_type>/",
        views.download_training_template,
        name="training_template",
    ),
    path(
        "training-performance/upload/<str:training_type>/",
        views.UploadTrainingPerformanceView.as_view(),  # temporarily exempt from CSRF
        name="training_upload",
    ),
    path(
        "attendance/<str:table_name>/",
        views.get_attendance_data,
        name="get_attendance_data",
    ),
    path(
        "get-attendance/<str:table_name>/",
        views.get_attendance_data,
        name="get_attendance_data",
    ),
    path(
        "save-branch-attendance/<str:table_name>/",
        csrf_exempt(views.save_branch_attendance),  # exempt if called from frontend
        name="save_branch_attendance",
    ),
    path("average-data/<str:table_name>/", views.get_avg_data, name="get_avg_data"),
    path("avg-data/<str:table_name>/", views.get_avg_data, name="get_avg_data"),
    path(
        "update-attendance/<str:table_name>/",
        csrf_exempt(views.update_attendance),
        name="update_attendance",
    ),
    path(
        "create-attendance-record/",
        csrf_exempt(views.CreateAttendanceRecord.as_view()),
        name="create_attendance_record",
    ),
    path(
        "student-analytics/",
        views.StudentAnalyticsViewSet.as_view({"get": "list"}),
        name="student-analytics-list",
    ),
    path(
        "student-analytics/<uuid:pk>",
        views.StudentAnalyticsViewSet.as_view({"get": "retrieve"}),
        name="student-analytics-detail",
    ),
    path(
        "aggregate-analytics/",
        views.AggregateAnalyticsView.as_view(),
        name="aggregate-analytics",
    ),
]
