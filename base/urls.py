from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login, name="login"),
    path(
        "password_reset/",
        views.password_reset_request,
        name="password_reset_request",
    ),
    path(
        "password_reset/verify_otp/",
        views.password_reset_verify_otp,
        name="password_reset_verify_otp",
    ),
    path(
        "password_reset/confirm/",
        views.password_reset_confirm,
        name="password_reset_confirm",
    ),
    path("logout/", views.logout_view, name="logout"),
]
