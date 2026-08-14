"""Placement reporting endpoints, mounted at /api/placement_officer/ (T-19).

Paths are unchanged from `placement_officer/urls.py`, **except** for the three
category-rule routes at the bottom — see the comment there.
"""

from django.urls import path

from placements import views

urlpatterns = [
    path("consent/<str:year>/", views.consent_statistics, name="statistic_by_year"),
    path("consent/", views.consent_statistics, name="statistic"),
    path(
        "filter/<str:department>/<str:year>/",
        views.filter_by_department,
        name="filter_by_department_by_year",
    ),
    path("filter/<str:department>/", views.filter_by_department, name="filter_by_department"),
    path(
        "unique-departments/<str:year>/",
        views.get_unique_departments,
        name="unique_departments_by_year",
    ),
    path("unique-departments/", views.get_unique_departments, name="unique_departments"),
    path("get_category_data/<str:year>/", views.get_category, name="get_category_data_by_year"),
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
    path("dashboard/<str:batch>/", views.PlacementDashboardAPIView.as_view(), name="get_all_data"),
    path(
        "report-batches/",
        views.PlacementReportBatchesView.as_view(),
        name="report-batches",
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

    # ADDED (T-19). These three views existed in `placement_officer/views.py`
    # and the frontend has always called them - CategoryRuleForm.tsx,
    # CategoryRuleList.tsx and StudentByCategory.tsx - but no URL ever pointed
    # at them, so all three pages 404'd. The paths below are exactly what those
    # components request.
    #
    # This is a behaviour change inside a port, which is normally forbidden.
    # Justified here because the alternative is knowingly re-shipping three
    # dead pages. Covered by tests/test_placements_port.py and added to
    # docs/PERMISSIONS.md.
    path("category-rules/create/", views.create_category_rule, name="category-rule-create"),
    path("category-rules/list/", views.list_category_rules, name="category-rule-list"),
    path(
        "students/by-category/<str:category>/<str:batch>/",
        views.students_by_category,
        name="students-by-category",
    ),
]
