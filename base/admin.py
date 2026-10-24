from django import forms
from django.contrib.admin import SimpleListFilter, register
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.db import transaction
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.import_export.forms import ExportForm, ImportForm
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import (
    NON_STUDENT_ROLES,
    PROGRAM_OPTIONS,
    FacultyResponsibility,
    FacultyStaffUser,
    StudentUser,
    User,
)
from .resources import FacultyResponsibilityResource


def get_department_choices():
    choices = [("", "---------")]
    known_depts = [
        "IT",
        "CMPN",
        "AI&DS",
        "AI&ML",
        "EXTC",
        "ELEX",
        "MECH",
        "CIVIL",
        "IOT",
        "CS&E",
    ]
    try:
        from institution.models import Department
        inst_depts = list(Department.objects.filter(is_active=True).values_list("code", flat=True))
        for d in inst_depts:
            if d and d not in known_depts:
                known_depts.append(d)
    except Exception:
        pass
    try:
        existing_depts = list(
            FacultyResponsibility.objects.exclude(department__isnull=True)
            .exclude(department="")
            .values_list("department", flat=True)
            .distinct()
        )
        for d in existing_depts:
            if d and d not in known_depts:
                known_depts.append(d)
    except Exception:
        pass
    for d in sorted(known_depts):
        choices.append((d, d))
    return choices


def get_program_choices():
    choices = [("", "---------")]
    for code, label in PROGRAM_OPTIONS:
        choices.append((code, label))
    return choices


class FacultyStaffDepartmentFilter(SimpleListFilter):
    title = "Department"
    parameter_name = "department"

    def lookups(self, request, model_admin):
        departments = (
            FacultyResponsibility.objects.exclude(department__isnull=True)
            .exclude(department="")
            .values_list("department", flat=True)
            .distinct()
            .order_by("department")
        )
        return [(d, d) for d in departments if d]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(facultyresponsibility__department=self.value())
        return queryset


class FacultyStaffProgramFilter(SimpleListFilter):
    title = "Program"
    parameter_name = "program"

    def lookups(self, request, model_admin):
        programs = (
            FacultyResponsibility.objects.exclude(program__isnull=True)
            .exclude(program="")
            .values_list("program", flat=True)
            .distinct()
            .order_by("program")
        )
        return [(p, p) for p in programs if p]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(facultyresponsibility__program=self.value())
        return queryset


def _normalize_unfold_form_args(args, kwargs):
    if "data" in kwargs and not args:
        return (kwargs.pop("data"),), kwargs
    return args, kwargs


# =============================================================================
# Faculty & Staff Users Admin
# =============================================================================

class FacultyStaffUserCreationForm(UserCreationForm):
    """
    Dedicated creation form for Faculty & Staff users.
    Only allows non-student roles and safely saves department and program assignments.
    """
    email = forms.EmailField(label="Email address", required=True)
    full_name = forms.CharField(label="Full name", max_length=100, required=True)
    role = forms.ChoiceField(
        label="Application Role",
        choices=NON_STUDENT_ROLES,
        initial="faculty",
        required=True,
        help_text="Select a valid faculty, staff, or administrative role. Student accounts cannot be created here.",
    )
    department = forms.ChoiceField(
        label="Department Assignment",
        required=False,
        help_text="Primary academic department (saved to FacultyResponsibility).",
    )
    program = forms.ChoiceField(
        label="Program Assignment",
        required=False,
        help_text="Primary training program assignment (saved to FacultyResponsibility).",
    )
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )
    is_staff = forms.BooleanField(
        label="Django Admin Access (is_staff)",
        required=False,
        initial=False,
        help_text="Designates whether this user can log into the Django Admin site.",
    )
    is_superuser = forms.BooleanField(
        label="Superuser Status (is_superuser)",
        required=False,
        initial=False,
        help_text="Designates that this user has all permissions without explicitly assigning them.",
    )

    class Meta:
        model = FacultyStaffUser
        fields = ("email", "full_name", "role", "department", "program", "is_staff", "is_superuser")

    def __init__(self, *args, **kwargs):
        args, kwargs = _normalize_unfold_form_args(args, kwargs)
        super().__init__(*args, **kwargs)
        self.fields["department"].choices = get_department_choices()
        self.fields["program"].choices = get_program_choices()
        self.fields["role"].choices = NON_STUDENT_ROLES

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("A user with this email address already exists.")
        return email

    def clean_role(self):
        role = self.cleaned_data.get("role")
        allowed_roles = [r[0] for r in NON_STUDENT_ROLES]
        if role not in allowed_roles:
            raise forms.ValidationError(
                f"Invalid role '{role}'. Student accounts cannot be created through the faculty/staff workflow."
            )
        return role

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        with transaction.atomic():
            user = super().save(commit=False)
            user.role = self.cleaned_data["role"]
            user.is_staff = self.cleaned_data.get("is_staff", False)
            user.is_superuser = self.cleaned_data.get("is_superuser", False)
            user.set_password(self.cleaned_data["password1"])
            if commit:
                user.save()
                dept = (self.cleaned_data.get("department") or "").strip() or None
                prog = (self.cleaned_data.get("program") or "").strip() or None
                if dept or prog:
                    FacultyResponsibility.objects.create(
                        user=user,
                        department=dept,
                        program=prog,
                    )
            return user


class FacultyStaffUserChangeForm(UserChangeForm):
    """
    Dedicated update form for Faculty & Staff users.
    Displays professional details and preserves existing passwords and responsibility records.
    """
    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text=(
            "Raw passwords are not stored. Use the 'Change password' link below "
            "to set a new password."
        ),
    )
    role = forms.ChoiceField(
        label="Application Role",
        choices=NON_STUDENT_ROLES,
        required=True,
    )
    department = forms.ChoiceField(
        label="Department Assignment",
        required=False,
        help_text="Primary department assignment in FacultyResponsibility.",
    )
    program = forms.ChoiceField(
        label="Program Assignment",
        required=False,
        help_text="Primary program assignment in FacultyResponsibility.",
    )

    class Meta:
        model = FacultyStaffUser
        fields = (
            "email",
            "password",
            "full_name",
            "role",
            "department",
            "program",
            "is_staff",
            "is_superuser",
        )

    def __init__(self, *args, **kwargs):
        args, kwargs = _normalize_unfold_form_args(args, kwargs)
        super().__init__(*args, **kwargs)
        self.fields["department"].choices = get_department_choices()
        self.fields["program"].choices = get_program_choices()
        self.fields["role"].choices = NON_STUDENT_ROLES
        if self.instance and self.instance.pk:
            resp = FacultyResponsibility.objects.filter(user=self.instance).first()
            if resp:
                if resp.department:
                    self.fields["department"].initial = resp.department
                if resp.program:
                    self.fields["program"].initial = resp.program

    def clean_role(self):
        role = self.cleaned_data.get("role")
        allowed_roles = [r[0] for r in NON_STUDENT_ROLES]
        if role not in allowed_roles:
            raise forms.ValidationError(
                f"Invalid role '{role}'. Faculty/staff accounts cannot be converted to student through this interface."
            )
        return role

    def clean_password(self):
        return self.initial["password"]

    def save(self, commit=True):
        with transaction.atomic():
            user = super().save(commit=commit)
            dept = (self.cleaned_data.get("department") or "").strip() or None
            prog = (self.cleaned_data.get("program") or "").strip() or None

            resp = FacultyResponsibility.objects.filter(user=user).first()
            if dept or prog:
                if resp:
                    resp.department = dept
                    resp.program = prog
                    resp.save()
                else:
                    FacultyResponsibility.objects.create(
                        user=user,
                        department=dept,
                        program=prog,
                    )
            elif resp and not dept and not prog:
                resp.department = None
                resp.program = None
                resp.save()
            return user


class FacultyResponsibilityInline(TabularInline):
    model = FacultyResponsibility
    extra = 0
    fields = ("department", "program")
    verbose_name = "Assigned Responsibility"
    verbose_name_plural = "All Assigned Responsibilities (Multi-hat)"


@register(FacultyStaffUser)
class FacultyStaffUserAdmin(BaseUserAdmin, ModelAdmin):
    form = FacultyStaffUserChangeForm
    add_form = FacultyStaffUserCreationForm
    change_password_form = AdminPasswordChangeForm
    inlines = [FacultyResponsibilityInline]

    ordering = ["full_name", "email"]
    list_display = [
        "full_name",
        "email",
        "role",
        "get_department",
        "get_program",
        "is_staff",
        "is_superuser",
    ]
    list_display_links = ["full_name", "email"]
    list_filter = ["role", "is_staff", "is_superuser", FacultyStaffDepartmentFilter, FacultyStaffProgramFilter]
    search_fields = [
        "email",
        "full_name",
        "facultyresponsibility__department",
        "facultyresponsibility__program",
        "id",
    ]
    readonly_fields = ["id"]
    list_per_page = 25
    show_full_result_count = True

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Professional Details & Assignments",
            {
                "fields": (
                    "full_name",
                    "role",
                    "department",
                    "program",
                    "id",
                )
            },
        ),
        (
            "Django Admin & Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
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
                    "department",
                    "program",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .exclude(role="student")
            .prefetch_related("facultyresponsibility_set")
            .order_by("full_name", "email")
        )

    def get_department(self, obj):
        depts = sorted(set(r.department for r in obj.facultyresponsibility_set.all() if r.department))
        return ", ".join(depts) if depts else "-"

    get_department.short_description = "Department"

    def get_program(self, obj):
        progs = sorted(set(r.program for r in obj.facultyresponsibility_set.all() if r.program))
        return ", ".join(progs) if progs else "-"

    get_program.short_description = "Program"


# =============================================================================
# Student Users Admin
# =============================================================================

class StudentUserCreationForm(UserCreationForm):
    """
    Dedicated creation form for Student user accounts.
    Enforces role='student' and protects academic workflows.
    """
    email = forms.EmailField(label="Email address", required=True)
    full_name = forms.CharField(label="Full name", max_length=100, required=True)
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = StudentUser
        fields = ("email", "full_name")

    def __init__(self, *args, **kwargs):
        args, kwargs = _normalize_unfold_form_args(args, kwargs)
        super().__init__(*args, **kwargs)

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("A user with this email address already exists.")
        return email

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "student"
        user.is_staff = False
        user.is_superuser = False
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class StudentUserChangeForm(UserChangeForm):
    """
    Dedicated change form for Student user accounts.
    Displays student-specific read-only details and prevents role tampering.
    """
    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text=(
            "Raw passwords are not stored. Use the 'Change password' link below "
            "to set a new password."
        ),
    )

    class Meta:
        model = StudentUser
        fields = (
            "email",
            "password",
            "full_name",
        )

    def __init__(self, *args, **kwargs):
        args, kwargs = _normalize_unfold_form_args(args, kwargs)
        super().__init__(*args, **kwargs)

    def clean_password(self):
        return self.initial["password"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "student"  # Always maintain student role
        if commit:
            user.save()
        return user


@register(StudentUser)
class StudentUserAdmin(BaseUserAdmin, ModelAdmin):
    form = StudentUserChangeForm
    add_form = StudentUserCreationForm
    change_password_form = AdminPasswordChangeForm

    ordering = ["email"]
    list_display = [
        "email",
        "full_name",
        "get_student_uid",
        "get_student_department",
        "get_student_batch",
        "get_student_year",
    ]
    list_display_links = ["email"]
    list_filter = ["students__department", "students__batch", "students__academic_year"]
    search_fields = ["email", "full_name", "students__uid", "students__department", "id"]
    readonly_fields = ["id", "student_uid", "student_department", "student_batch", "student_academic_year"]
    list_per_page = 25
    show_full_result_count = True

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Account Info", {"fields": ("full_name", "id")}),
        (
            "Academic Profile (Managed via Students section)",
            {
                "fields": (
                    "student_uid",
                    "student_department",
                    "student_batch",
                    "student_academic_year",
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
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .filter(role="student")
            .select_related("students")
            .order_by("email")
        )

    def student_uid(self, obj):
        student = getattr(obj, "students", None)
        return student.uid if student else "-"

    student_uid.short_description = "UID"

    def student_department(self, obj):
        student = getattr(obj, "students", None)
        return student.department if student else "-"

    student_department.short_description = "Department"

    def student_batch(self, obj):
        student = getattr(obj, "students", None)
        return student.batch if student else "-"

    student_batch.short_description = "Batch"

    def student_academic_year(self, obj):
        student = getattr(obj, "students", None)
        return student.academic_year if student else "-"

    student_academic_year.short_description = "Academic Year"

    def get_student_uid(self, obj):
        student = getattr(obj, "students", None)
        return student.uid if student else "-"

    get_student_uid.short_description = "UID"
    get_student_uid.admin_order_field = "students__uid"

    def get_student_department(self, obj):
        student = getattr(obj, "students", None)
        return student.department if student else "-"

    get_student_department.short_description = "Department"
    get_student_department.admin_order_field = "students__department"

    def get_student_batch(self, obj):
        student = getattr(obj, "students", None)
        return student.batch if student else "-"

    get_student_batch.short_description = "Batch"
    get_student_batch.admin_order_field = "students__batch"

    def get_student_year(self, obj):
        student = getattr(obj, "students", None)
        return student.academic_year if student else "-"

    get_student_year.short_description = "Year"
    get_student_year.admin_order_field = "students__academic_year"



# =============================================================================
# Generic User Admin (System Audit)
# =============================================================================

class CustomUserChangeForm(UserChangeForm):
    """Form for updating users across all types for system auditing."""
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ("email", "password", "full_name", "role", "is_staff", "is_superuser")

    def clean_password(self):
        return self.initial["password"]


@register(User)
class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    """
    System-wide user administration view.
    To prevent accidental creation mistakes, user creation is routed through
    dedicated 'Faculty & Staff Users' and 'Student Users' sections.
    """
    form = CustomUserChangeForm
    change_password_form = AdminPasswordChangeForm

    ordering = ["email"]
    list_display = ["email", "full_name", "role", "is_staff", "is_superuser"]
    list_display_links = ["email"]
    list_filter = ["role", "is_staff", "is_superuser"]
    search_fields = ["email", "full_name", "role", "id"]
    readonly_fields = ["id"]
    list_per_page = 25
    show_full_result_count = True

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "role", "id")}),
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

    def has_add_permission(self, request):
        # Direct administrators to dedicated Student or Faculty/Staff creation workflows
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).order_by("email")


# =============================================================================
# Faculty Responsibility Admin (Import / Export)
# =============================================================================

@register(FacultyResponsibility)
class FacultyAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    search_fields = ["user__email", "user__full_name", "department", "program"]
    list_display = [
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
