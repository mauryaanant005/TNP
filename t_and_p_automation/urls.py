"""
URL configuration for t_and_p_automation project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from base.views import user_profile, password_update
from django.views.generic import TemplateView

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/department_coordinator/", include("department_coordinator.urls")),
        path("auth/", include("base.urls")),
        path("api/placement_officer/", include("placement_officer.urls")),
        path("api/training_officer/", include("training_officer.urls")),
        path("api/", views.my_protected_view, name="check-auth"),
        path("api/notifications/", include("notifications.urls")),
        path("api/program_coordinator/", include("program_coordinator_api.urls")),
        path("api/internship/", include("internship_api.urls")),
        path("api/student/", include("student.urls")),
        path("api/faculty_coordinator/", include("faculty_coordinator.urls")),
        path("api/logout/", views.logout_api, name="logout"),
        path("profile/", user_profile, name="user_profile"),
        path(
            "profile/update_password",
            password_update,
            name="user_profile_update_password",
        ),
        path("api/staff/", include("staff.urls")),
        re_path(
            r"^(?!api|admin|static|media).*$",
            TemplateView.as_view(template_name="index.html"),
        ),
    ]
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
)
