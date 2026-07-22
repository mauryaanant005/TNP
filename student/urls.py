from django.urls import path
from .views import ResumeView, SessionAttendanceAPIView,PlacementCompanyAPIView,StudentProfileView,PlacementCard,StudentInternshipListView
from .views import StudentTrainingPerformanceAPIView

urlpatterns = [
    path("info/", StudentProfileView.as_view(), name="sdp-api"),
    path("resume/", ResumeView.as_view(), name="resume-api"),
    path("attendance-data/", SessionAttendanceAPIView.as_view(), name="attendance-api"),
    path("company/register",PlacementCompanyAPIView.as_view(),name="company-register-api"),
    path("placement-card/",PlacementCard.as_view(),name="placement-card-api"),
     path(
        "training-performance/",
        StudentTrainingPerformanceAPIView.as_view(),
        name="student_training_performance"
    ),
    path("internships/", StudentInternshipListView.as_view(), name="student-internships"),
]
