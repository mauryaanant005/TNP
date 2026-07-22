from django.contrib.admin import register
from unfold.admin import ModelAdmin
from .models import Student
from import_export.admin import ImportExportModelAdmin
from unfold.contrib.import_export.forms import (
    ExportForm,
    ImportForm,
)
from .resources import StudentResource

# Register your models here.


@register(Student)
class StudentAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    search_fields = ["uid", "user__full_name", "user__email"]
    list_display = [
        "uid",
        "department",
        "get_student_name",
        "get_student_email",
    ]

    def get_student_name(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_student_email(self, obj):
        return obj.user.email if obj.user else ""

    get_student_name.short_description = "Name"
    get_student_email.short_description = "Email"
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "uid",
                    "department",
                    "academic_year",
                    "user",
                    "current_category",
                    "is_dse_student",
                    "gender",
                    "dob",
                    "contact",
                    "personal_email",
                    "tenth_grade",
                    "higher_secondary_grade",
                    "card",
                    "consent",
                ),
            },
        ),
    )
    resource_class = StudentResource

    def _log_actions(self, result, request):
        from import_export.results import RowResult
        rows = {}
        for row in result:
            if row.import_type in (RowResult.IMPORT_TYPE_SKIP, RowResult.IMPORT_TYPE_ERROR):
                continue
            rows.setdefault(row.import_type, [])
            rows[row.import_type].append(row.instance)

        self._create_log_entries(request.user.pk, rows)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs

        if request.user.role in ["faculty", "staff"]:
            from base.models import FacultyResponsibility
            from django.db.models import Q
            try:
                responsibilities = FacultyResponsibility.objects.filter(user=request.user)
                if responsibilities.exists():
                    # Build prefix-aware Q: 'IT' matches 'IT', 'IT-A', 'IT-B', 'IT-C'
                    q = Q()
                    for dept in responsibilities.values_list('department', flat=True):
                        q |= Q(department=dept) | Q(department__startswith=f"{dept}-")
                    return qs.filter(q)
                else:
                    return qs.none()
            except Exception:
                return qs.none()
        return qs
