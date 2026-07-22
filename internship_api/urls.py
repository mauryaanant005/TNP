from django.urls import path
from .views import (
    create_company_with_offers,
    get_all_companies,
    get_company_with_offers,
    job_application,
    get_unverified_internships,
    verify_selected_internships,
    get_verified_internships,
    download_verified_internships,
)

urlpatterns = [
    path("company/register/", create_company_with_offers),
    path("company/", get_all_companies),
    path("company/<str:pk>", get_company_with_offers),
    path("job_application/create/<str:pk>", job_application),
    path("jobs/verify/", get_unverified_internships),
    path("jobs/verify/selected/", verify_selected_internships),
    path("jobs/reports/", get_verified_internships),
    path("jobs/download-report/", download_verified_internships),
]