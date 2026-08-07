from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin
from django.db import models
import uuid
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
import pyotp


class CustomUserManager(UserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("You have not provided a valid e-mail address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        try:
            send_mail(
                "Account Created",
                f"Your account has been created. Your username is {email}. Please use the forgot password option or contact your administrator to set your password.",
                settings.EMAIL_HOST_USER,  # Use settings.EMAIL_HOST_USER as the from email
                [email],  # Recipient list should be a list of email addresses
                fail_silently=False,  # Make sure to catch actual errors
            )
        except Exception as e:
            # Error log removed to prevent PII leakage
            pass
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra_fields):
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "system_admin")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_ROLE_TYPE = [
        ("student", "student"),
        ("system_admin", "system_admin"),
        ("principal", "principal"),
        ("training_officer", "training_officer"),
        ("placement_officer", "placement_officer"),
        ("internship_officer", "internship_officer"),
        ("faculty", "faculty"),
        ("staff", "staff"),
        ("department_coordinator", "department_coordinator"),
        ("program_coordinator", "program_coordinator"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    role = models.CharField(choices=USER_ROLE_TYPE, max_length=200, default="student")
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        app_label = "base"

    def get_full(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.password:
            default_pwd = getattr(settings, "DEFAULT_SEED_PASSWORD", os.getenv("DEFAULT_SEED_PASSWORD", "tcet@1234"))
            self.set_password(default_pwd)
        elif not (self.password.startswith(('pbkdf2_sha256$', 'pbkdf2_sha1$', 'argon2$', 'bcrypt$', 'scrypt$', 'bcrypt_sha256$')) or self.password.startswith('!')):
            self.set_password(self.password)
        super().save(*args, **kwargs)


class UserDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device_id = models.CharField(max_length=255, unique=True)
    is_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(auto_now=True)


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_secret = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_otp_secret(cls, user):
        otp_secret = pyotp.random_base32()
        return cls.objects.create(user=user, otp_secret=otp_secret)

    def verify_otp(self, otp):
        totp = pyotp.TOTP(self.otp_secret, interval=600)  # 10 minutes validity
        return totp.verify(otp) and self.created_at >= timezone.now() - timedelta(
            minutes=10
        )


PROGRAM_OPTIONS = [
    ("ACT_Technical", "ACT_Technical"),
    ("ACT_Aptitude", "ACT_Aptitude"),
    ("Coding_Contest", "Coding_Contest"),
    ("SDP", "SDP"),
]


class FacultyResponsibility(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program = models.CharField(max_length=255, null=True)
    department = models.CharField(max_length=255, null=True)
