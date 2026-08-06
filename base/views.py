from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as login_user, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from base.models import User, PasswordResetOTP
import pyotp
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail
from django.conf import settings
import logging
from dotenv import load_dotenv
from django_ratelimit.decorators import ratelimit

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)


def send_otp(email, otp, subject="OTP Verification"):
    html_message = render_to_string("emails/otp.html", {"otp": otp})
    plain_message = strip_tags(html_message)
    from_email = settings.DEFAULT_FROM_EMAIL
    to = email
    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            [to],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info("OTP sent successfully to [REDACTED]")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP: {str(e)}")
        return False


def redirect_user(request, user):
    login_user(request, user)
    response = redirect(settings.CLIENT_URL)
    response.set_cookie("is_logged_in", "true", httponly=False, samesite="Lax")
    return response


@never_cache
@csrf_exempt
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
def login(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not email or not password:
            messages.error(request, "Both email and password are required.")
            return render(request, "base/login.html")

        user = authenticate(request, email=email, password=password)
        if user is not None:
            response = redirect_user(request, user)
            return response
        else:
            messages.error(request, "Invalid email or password.")

    return render(request, "base/login.html")


@never_cache
@ratelimit(key="ip", rate="3/h", method="POST", block=True)
def password_reset_request(request):
    if request.method == "POST":
        email = request.POST.get("email")
        # Always respond identically whether or not the account exists, and always
        # send the user to the same next step - otherwise the response is a direct
        # oracle for enumerating registered email addresses.
        try:
            user = User.objects.get(email=email)
            otp_obj = PasswordResetOTP.generate_otp_secret(user)
            totp = pyotp.TOTP(otp_obj.otp_secret, interval=600)
            otp = totp.now()
            send_otp(user.email, otp, subject="Password Reset OTP")
        except User.DoesNotExist:
            pass
        request.session["email"] = email
        messages.success(
            request, "If an account with that email exists, an OTP has been sent."
        )
        return redirect("password_reset_verify_otp")

    return render(request, "base/password_reset_request.html")


@never_cache
@ratelimit(key="ip", rate="5/h", method="POST", block=True)
def password_reset_verify_otp(request):
    if request.method == "POST":
        email = request.session.get("email")
        otp = request.POST.get("otp")
        try:
            user = User.objects.get(email=email)
            otp_obj = PasswordResetOTP.objects.filter(user=user).latest("created_at")
            if otp_obj.verify_otp(otp):
                # Single-use: invalidate immediately so the same OTP can't be replayed.
                PasswordResetOTP.objects.filter(user=user).delete()
                request.session["reset_user_id"] = str(user.id)
                return redirect("password_reset_confirm")
            else:
                messages.error(request, "Invalid or expired OTP.")
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            messages.error(request, "Invalid email or OTP.")
    return render(request, "base/password_reset_verify_otp.html")


@never_cache
@ratelimit(key="ip", rate="5/h", method="POST", block=True)
def password_reset_confirm(request):
    user_id = request.session.get("reset_user_id")
    if not user_id:
        return redirect("password_reset_request")
    user = User.objects.get(id=user_id)
    if request.method == "POST":
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")
        if password == confirm_password:
            user.set_password(password)
            user.save()
            del request.session["reset_user_id"]
            PasswordResetOTP.objects.filter(user=user).delete()
            messages.success(request, "Your password has been reset successfully.")
            return redirect("login")
        else:
            messages.error(request, "Passwords do not match.")
    return render(request, "base/password_reset_confirm.html")


def logout_view(request):
    logout(request)
    response = redirect('login')
    response.delete_cookie("is_logged_in")
    return response


@login_required
def user_profile(request):
    user = User.objects.get(id=request.user.id)
    return render(request, "base/user_profile.html", {"user": user})


@never_cache
@login_required
def password_update(request):
    user = User.objects.get(id=request.user.id)
    if request.method == "POST":
        password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")
        if password == confirm_password:
            user.set_password(password)
            user.save()
            messages.success(request, "Password updated successfully.")
        else:
            messages.error(request, "Passwords do not match.")
    return render(request, "base/password_update.html")
