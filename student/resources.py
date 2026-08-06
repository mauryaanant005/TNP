import os
from django.contrib.auth.hashers import make_password
from django.db import transaction
from import_export import resources
from .models import Student, User
from uuid import uuid4

DEFAULT_STUDENT_IMPORT_PASSWORD = os.getenv("DEFAULT_STUDENT_IMPORT_PASSWORD", "tcet@1234")


class StudentResource(resources.ModelResource):
    class Meta:
        model = Student
        fields = (
            "email",
            "full_name",
            "role",
            "password",
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
            'division',
        )
        import_id_fields = ("uid",)

    def skip_row(self, instance, original, row, import_validation_errors=None):
        email = row.get("email")
        uid = row.get("uid")
        if not email or not str(email).strip() or not uid or not str(uid).strip():
            return True
        return super().skip_row(instance, original, row, import_validation_errors)

    def import_row(self, row, instance_loader, **kwargs):
        email = row.get("email")
        if not email or not str(email).strip():
            return super().import_row(row, instance_loader, **kwargs)

        email = str(email).strip()
        
        # Get existing or cached user
        user = getattr(self, "existing_users", {}).get(email) or getattr(self, "created_users_cache", {}).get(email)
        
        if not user:
            # The user should have been bulk created in import_data
            pass
            
        if user:
            row["user"] = user.id

        # Validate and set fields with default values if not provided
        row["current_category"] = row.get("current_category", "No category")
        row["is_dse_student"] = row.get("is_dse_student", False)
        row["gender"] = row.get("gender", "Not Provided")
        row["contact"] = row.get("contact", "Not Provided")
        row["card"] = row.get("card", "Green")
        row["consent"] = row.get("consent", "placement")

        return super().import_row(row, instance_loader, **kwargs)

    def get_or_init_instance(self, instance_loader, row):
        # Ensure `user` field links correctly to an existing User
        instance, created = super().get_or_init_instance(instance_loader, row)
        if not created:
            email = str(row.get("email", "")).strip()
            user = getattr(self, "existing_users", {}).get(email) or getattr(self, "created_users_cache", {}).get(email)
            if not user and email:
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    user = None
            if user:
                instance.user = user
        return instance, created

    @transaction.atomic
    def import_data(
        self,
        dataset,
        dry_run=False,
        raise_errors=False,
        use_transactions=None,
        collect_failed_rows=False,
        **kwargs,
    ):
        self.dry_run = dry_run
        
        # Pre-fetch existing users to avoid N+1 SELECT queries
        emails = []
        for row in dataset.dict:
            email = row.get("email")
            if email:
                emails.append(str(email).strip())
                
        self.existing_users = {
            user.email: user for user in User.objects.filter(email__in=emails)
        }
        self.created_users_cache = {}
        
        # Bulk create missing users
        users_to_create = []
        for row in dataset.dict:
            email = row.get("email")
            if not email or not str(email).strip():
                continue
            email = str(email).strip()
            if email not in self.existing_users and email not in self.created_users_cache:
                raw_password = row.get("password") or DEFAULT_STUDENT_IMPORT_PASSWORD
                if dry_run or kwargs.get("dry_run", False):
                    hashed_password = "dummy_hash_for_dry_run"
                else:
                    hashed_password = make_password(raw_password)
                
                new_user = User(
                    id=uuid4(),
                    email=email,
                    full_name=row.get("full_name", "") or "",
                    password=hashed_password,
                    role="student",
                )
                users_to_create.append(new_user)
                self.created_users_cache[email] = new_user

        if users_to_create:
            User.objects.bulk_create(users_to_create, batch_size=500)

        return super().import_data(
            dataset,
            dry_run,
            raise_errors,
            use_transactions,
            collect_failed_rows,
            **kwargs,
        )
