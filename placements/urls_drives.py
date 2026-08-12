"""Placement drive endpoints, mounted at /api/staff/ (T-19).

The prefix is unchanged from when these lived in `staff/`. Renaming it would
mean a coordinated frontend release for no functional gain; the app they live
in is what needed fixing, not the URL. Rename it later, behind the generated
client (T-22), one endpoint at a time.
"""

from django.urls import path

from placements import views

urlpatterns = [
    path("placement/company/", views.CompanyListCreateView.as_view(), name="company-list-create"),
    path("placement/company/<str:id>/", views.CompanyDetailView.as_view(), name="company-detail"),
    path(
        "placement/companies/batch/<str:batch>/",
        views.CompanyByBatchView.as_view(),
        name="companies-by-batch",
    ),
    path("companies/batches/", views.CompanyBatchesView.as_view(), name="company-batches"),
    path(
        "placement/company/send_notifications/<str:id>/",
        views.SendPlacementNotificationApiView.as_view(),
        name="send-placement-notifications",
    ),
    path(
        "company/<str:company_id>/interested-students/",
        views.PaginatedInterestedStudentsView.as_view(),
        name="company-interested-students",
    ),
    path(
        "company/<str:company_id>/not-interested-students/",
        views.PaginatedNotInterestedStudentsView.as_view(),
        name="company-not-interested-students",
    ),
    path(
        "company/<str:company_id>/eligible-not-registered/",
        views.EligibleButNotRegisteredView.as_view(),
        name="company-eligible-not-registered",
    ),
    path(
        "company/bulk-update-progress/",
        views.BulkUpdateProgressView.as_view(),
        name="bulk-update-progress",
    ),
    path(
        "company/<str:company_id>/trigger-excel-export/",
        views.TriggerExcelExportView.as_view(),
        name="trigger-excel-export",
    ),
    path(
        "company/<str:company_id>/trigger-resume-export/",
        views.TriggerResumeExportView.as_view(),
        name="trigger-resume-export",
    ),
    path("task-status/<str:task_id>/", views.GetTaskStatusView.as_view(), name="get-task-status"),
    path(
        "historical-import/upload/",
        views.UploadHistoricalImportView.as_view(),
        name="historical-import-upload",
    ),
    path(
        "historical-import/status/<str:task_id>/",
        views.HistoricalImportStatusView.as_view(),
        name="historical-import-status",
    ),
    path(
        "update/student/<str:uid>/",
        views.StudentDetailUpdateView.as_view(),
        name="student-detail-update",
    ),
    path("category_update/", views.UpdateStudentCategoryView.as_view(), name="bulk-category-update"),
]
