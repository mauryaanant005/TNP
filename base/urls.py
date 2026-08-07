from django.urls import path
from . import views

urlpatterns = [
    # Legacy server-rendered views
    path("login/", views.login, name="login"),
    path("password_reset/", views.password_reset_request, name="password_reset_request"),
    path("password_reset/verify_otp/", views.password_reset_verify_otp, name="password_reset_verify_otp"),
    path("password_reset/confirm/", views.password_reset_confirm, name="password_reset_confirm"),
    path("logout/", views.logout_view, name="logout"),

    # Modern REST API Endpoints (React SPA)
    path("api/password_reset/request/", views.api_password_reset_request, name="api_password_reset_request"),
    path("api/password_reset/resend_otp/", views.api_password_reset_resend_otp, name="api_password_reset_resend_otp"),
    path("api/password_reset/verify_otp/", views.api_password_reset_verify_otp, name="api_password_reset_verify_otp"),
    path("api/password_reset/confirm/", views.api_password_reset_confirm, name="api_password_reset_confirm"),

    # Passkey (WebAuthn / FIDO2) API Endpoints
    path("api/passkey/register/begin/", views.passkey_register_begin, name="passkey_register_begin"),
    path("api/passkey/register/finish/", views.passkey_register_finish, name="passkey_register_finish"),
    path("api/passkey/login/begin/", views.passkey_login_begin, name="passkey_login_begin"),
    path("api/passkey/login/finish/", views.passkey_login_finish, name="passkey_login_finish"),
    path("api/passkey/credentials/", views.passkey_credentials_api, name="passkey_credentials_list"),
    path("api/passkey/credentials/<uuid:pk>/", views.passkey_credentials_api, name="passkey_credentials_detail"),
]
