from pathlib import Path
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

# Load .env
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------
# ENVIRONMENT MODE
# ---------------------------------
ENV = os.getenv("ENV", "PROD").upper()  # DEV or PROD - defaults to PROD (safe/locked-down) if unset
IS_DEV = ENV == "DEV"

print("Running Django in:", ENV, "(DEV mode)" if IS_DEV else "(PROD mode)")


def require_env(name):
    """Fetch a required env var, or refuse to start the app if it's missing."""
    value = os.getenv(name)
    if not value:
        raise ImproperlyConfigured(
            f"Environment variable '{name}' is required when ENV=PROD but was not set."
        )
    return value


# ---------------------------------
# SECRET / DEBUG
# ---------------------------------
if IS_DEV:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
else:
    # In production, require SECRET_KEY to be set in environment variables
    SECRET_KEY = require_env("SECRET_KEY")
DEBUG = IS_DEV


# ---------------------------------
# HOSTS
# ---------------------------------
if IS_DEV:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", os.getenv("CURRENT_HOST", "172.30.10.5")]
else:
    ALLOWED_HOSTS = ["*", "backend"]  # for Docker + Caddy


# ---------------------------------
# INSTALLED APPS
# ---------------------------------
INSTALLED_APPS = [
    "daphne",
    # default apps
    "unfold",
    "unfold.contrib.forms",
    "unfold.contrib.import_export",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "tailwind",
    "import_export",
    "django_cotton",
    "rest_framework",
    "corsheaders",
    # Project apps
    "base",
    "student",
    "department_coordinator",
    "placement_officer",
    "training_officer",
    "notifications",
    "program_coordinator_api",
    "internship_api",
    "faculty_coordinator",
    "staff",
]

# ---------------------------------
# MIDDLEWARE
# ---------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # For frontend dev mode
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "base.middleware.NoCacheMiddleware",
    "base.middleware.ContentSecurityPolicyMiddleware",
]


ROOT_URLCONF = "t_and_p_automation.urls"


# ---------------------------------
# TEMPLATES  (React prod build will go inside templates/)
# ---------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "libraries": {
                "staticfiles": "django.templatetags.static",
            },
            "loaders": [
                (
                    "django.template.loaders.cached.Loader",
                    [
                        "django_cotton.cotton_loader.Loader",
                        "django.template.loaders.filesystem.Loader",
                        "django.template.loaders.app_directories.Loader",
                    ],
                )
            ],
            "builtins": ["django_cotton.templatetags.cotton"],
        },
    },
]

WSGI_APPLICATION = "t_and_p_automation.wsgi.application"
ASGI_APPLICATION = "t_and_p_automation.asgi.application"

REDIS_HOST = os.getenv("REDIS_HOST", "redis" if not IS_DEV else "localhost")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD") if IS_DEV else require_env("REDIS_PASSWORD")
REDIS_AUTH = f":{REDIS_PASSWORD}@" if REDIS_PASSWORD else ""

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [f"redis://{REDIS_AUTH}{REDIS_HOST}:6379/2"],
        },
    },
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": f"redis://{REDIS_AUTH}{REDIS_HOST}:6379/1",
    }
}

# ---------------------------------
# DATABASE
# ---------------------------------
if IS_DEV:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "data" / "db.sqlite3",
            "OPTIONS": {
                "timeout": 20,
            }
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": require_env("DATABASE_NAME"),
            "USER": require_env("DATABASE_USER"),
            "PASSWORD": require_env("DATABASE_PASSWORD"),
            "HOST": os.getenv("DATABASE_HOST", "mysql"),
            "PORT": "3306",
            "OPTIONS": {
                "ssl": {"ssl-mode": os.getenv("DATABASE_SSL_MODE", "REQUIRED")},
            },
        }
    }


# ---------------------------------
# REST FRAMEWORK
# ---------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "base.error_utils.drf_exception_handler",
}


# ---------------------------------
# PASSWORD VALIDATION
# ---------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------
# INTERNATIONALIZATION
# ---------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True


STATIC_URL = "/static/"
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


if IS_DEV:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
else:
    CORS_ALLOWED_ORIGINS = []
    CSRF_TRUSTED_ORIGINS = []

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_CREDENTIALS = True


# ---------------------------------
# EMAIL
# ---------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv("EMAIL_USERNAME") if IS_DEV else require_env("EMAIL_USERNAME")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_PASSWORD") if IS_DEV else require_env("EMAIL_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


CELERY_BROKER_URL = f"redis://{REDIS_AUTH}{REDIS_HOST}:6379/0"
CELERY_RESULT_BACKEND = f"redis://{REDIS_AUTH}{REDIS_HOST}:6379/0"

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "base.User"

UNFOLD = {
    "SITE_TITLE": "Admin site",
    "SITE_HEADER": "Thakur college of engineering and technology",
    "COLORS": {
        "primary": {
            "50": "#fff7ed",
            "100": "#ffedd5",
            "200": "#fed7aa",
            "300": "#fdba74",
            "400": "#fb923c",
            "500": "#f97316",
            "600": "#ea580c",
            "700": "#c2410c",
            "800": "#9a3412",
            "900": "#7c2d12",
        }
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "show_home_link": True,
        "collapsible": False,
        "navigation": [
            {
                "title": _("Navigation"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Dashboard"),
                        "link": reverse_lazy("admin:index"),
                        "permission": lambda request: request.user.is_superuser,
                    },
                    {
                        "title": _("Users"),
                        "link": reverse_lazy("admin:base_user_changelist"),
                    },
                    {
                        "title": _("Student"),
                        "link": reverse_lazy("admin:student_student_changelist"),
                    },
                ],
            }
        ],
    },
}

LOGIN_URL = "/auth/login/"

# SECURE_SSL_REDIRECT stays False until the reverse proxy (Caddy) actually terminates
# TLS - the current Caddyfile serves plain HTTP only (`auto_https off`, `:80`). Flipping
# this to True before HTTPS is live would break every request with a redirect to a
# non-existent https:// listener. Flip it once TLS is configured.
SECURE_SSL_REDIRECT = False

# ---------------------------------
# SECURITY HEADERS
# ---------------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
# HSTS: safe to set even before TLS is live - browsers ignore the header over plain
# HTTP, so this has no effect until SECURE_SSL_REDIRECT above is also flipped on.
SECURE_HSTS_SECONDS = 31536000 if not IS_DEV else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not IS_DEV
SECURE_HSTS_PRELOAD = not IS_DEV

# ---------------------------------
# COOKIE SECURITY
# ---------------------------------
SESSION_COOKIE_SECURE = not IS_DEV
CSRF_COOKIE_SECURE = not IS_DEV
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
