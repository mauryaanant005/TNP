from django.urls import path
from . import views

urlpatterns = [
    path("consent/<str:year>/", views.statistic, name="statistic_by_year"),
    path("consent/", views.statistic, name="statistic"),
    path(
        "filter/<str:department>/<str:year>/",
        views.filter_by_department,
        name="filter_by_department_by_year",
    ),
    path(
        "filter/<str:department>/",
        views.filter_by_department,
        name="filter_by_department",
    ),
    path(
        "unique-departments/<str:year>/",
        views.get_unique_departments,
        name="unique_departments_by_year",
    ),
    path(
        "unique-departments/", views.get_unique_departments, name="unique_departments"
    ),
    path(
        "get_category_data/<str:year>/",
        views.get_category,
        name="get_category_data_by_year",
    ),
    path("get_category_data/", views.get_category, name="get_category_data"),
    path(
        "get_category_data_by_department/<str:department>/<str:year>/",
        views.get_category_by_department,
        name="get_category_data_by_department_by_year",
    ),
    path(
        "get_category_data_by_department/<str:department>/",
        views.get_category_by_department,
        name="get_category_data_by_department",
    ),
    path(
        "get_data_by_year/<str:batch>/",
        views.ConsolidationReportAPIView.as_view(),
        name="get_data_by_year",
    ),
    path(
        "dashboard/<str:batch>/",
        views.PlacementDashboardAPIView.as_view(),
        name="get_all_data",
    ),
    path(
        "branch_wise_report/<str:batch>/",
        views.BranchwiseReportAPIView.as_view(),
        name="branch_wise_report",
    ),
    path(
        "student_detail_report/<str:batch>/",
        views.StudentDetailReportAPIView.as_view(),
        name="student_detail_report",
    ),
]
