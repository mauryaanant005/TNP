from django.contrib.auth.decorators import login_required
from base.views import redirect_user
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response as JSONResponse
from base.models import User, FacultyResponsibility
from django.contrib.auth import logout
from student.models import Student
from django.views.static import serve
from django.shortcuts import render
from django.conf import settings
from django.db import connections
from django.http import JsonResponse

def serve_static(request, path, document_root=""):
    return serve(request, path, document_root, show_indexes=True)


def serve_media(request, path):
    """Serve /media/ uploads directly - there's no Caddy/Nginx in front of
    the api container anymore to read them off a shared volume (TCET
    hosting standard: Traefik only routes by Host header, it doesn't serve
    files). Mirrors the security headers the old Caddyfile applied: nosniff
    everywhere, plus a forced download for anything that isn't a
    server-validated profile image, since uploaded media has no
    content-type restriction otherwise.
    """
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    response["X-Content-Type-Options"] = "nosniff"
    if not path.startswith("profile_images/"):
        response["Content-Disposition"] = "attachment"
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    try:
        connections["default"].cursor()
        return JsonResponse({"status": "ok"})
    except Exception:
        return JsonResponse({"status": "error"}, status=503)


@api_view(["GET"])
def my_protected_view(request): 
    if not request.user or not request.user.is_authenticated:
        return JSONResponse({"detail": "Not authenticated"}, status=401)
    
    try:
        current_user = User.objects.get(email=request.user.email)
        if current_user.role == "faculty":
            faculty = FacultyResponsibility.objects.filter(user=current_user).first()
            if faculty:
                return JSONResponse(
                    {
                        "role": "faculty",
                        "email": current_user.email,
                        "department": faculty.department,
                        "program": faculty.program,
                    }
                )
            else:
                return JSONResponse(
                    {
                        "role": "faculty",
                        "email": current_user.email,
                        "department": None,
                        "program": None,
                    }
                )
        if current_user.role == "student":
            student = Student.objects.filter(user=current_user).first()
            if student:
                return JSONResponse(
                    {
                        "role": "student",
                        "email": current_user.email,
                        "department": student.department,
                        "academic_year": student.academic_year,
                    }
                )
            else:
                return JSONResponse(
                    {
                        "role": "student",
                        "email": current_user.email,
                        "department": None,
                        "academic_year": None,
                    }
                )
        return JSONResponse({"role": current_user.role, "email": current_user.email})
    except User.DoesNotExist:
        return JSONResponse({"detail": "User not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    response = JSONResponse({"message": "Logged out successfully."})
    response.delete_cookie("is_logged_in")
    return response

@login_required
def index(request):
    return render(request, "index.html")