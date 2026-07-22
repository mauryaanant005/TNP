from django.contrib.admin import register
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from .models import User
from unfold.admin import ModelAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .resources import FacultyResponsibilityResource


class CustomUserCreationForm(UserCreationForm):
    """Form for creating new users. Includes all the required fields, plus a repeated password field."""

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "role")

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(UserChangeForm):
    """Form for updating users. Replaces the password field with a password hash display."""

    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ("email", "password", "full_name", "role", "is_staff", "is_superuser")

    def clean_password(self):
        # Return the initial value, regardless of what the user provides
        return self.initial["password"]


@register(User)
class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    change_password_form = AdminPasswordChangeForm
    ordering = ["email"]
    list_display = ["email", "full_name", "role"]
    list_filter = ["role", "is_superuser"]
    search_fields = ["email", "full_name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_superuser",
                    "is_staff",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "role",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )


from django.contrib.admin import register
from unfold.admin import ModelAdmin
from .models import FacultyResponsibility
from import_export.admin import ImportExportModelAdmin
from unfold.contrib.import_export.forms import (
    ExportForm,
    ImportForm,
)


# Register your models here.


@register(FacultyResponsibility)
class FacultyAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    search_fields = ["user__email", "user__full_name"]
    list_display = [
        # "uid",
        "department",
        "program",
        "get_faculty_name",
        "get_faculty_email",
    ]

    def get_faculty_name(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_faculty_email(self, obj):
        return obj.user.email if obj.user else ""

    get_faculty_name.short_description = "Name"
    get_faculty_email.short_description = "Email"
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "user",
                    "department",
                    "program",
                ),
            },
        ),
    )
    resource_class = FacultyResponsibilityResource

    def _log_actions(self, result, request):
        from import_export.results import RowResult
        rows = {}
        for row in result:
            if row.import_type in (RowResult.IMPORT_TYPE_SKIP, RowResult.IMPORT_TYPE_ERROR):
                continue
            rows.setdefault(row.import_type, [])
            rows[row.import_type].append(row.instance)

        self._create_log_entries(request.user.pk, rows)
