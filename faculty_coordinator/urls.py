# attendance/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("data", views.get_program_data, name="get_program_data"),
    path("save-attendance", views.save_attendance, name="save_attendance"),
    path("attendance", views.get_attendance, name="get_attendance"),
    path("reset-attendance", views.reset_attendance, name="reset_attendance"),
]
