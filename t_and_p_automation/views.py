from django.contrib.auth.decorators import login_required
from base.views import redirect_user
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response as JSONResponse
from base.models import User, FacultyResponsibility
from django.contrib.auth import logout
from student.models import Student
from django.views.static import serve
from django.shortcuts import render

def serve_static(request, path, document_root=""):
    return serve(request, path, document_root, show_indexes=True)


@api_view(["GET"])
def my_protected_view(request): 
    if not request.user or not request.user.is_authenticated:
        return JSONResponse({"detail": "Not authenticated"}, status=401)
    
    try:
        current_user = User.objects.get(email=request.user.email)
        if current_user.role == "faculty":
            try:
                faculty = FacultyResponsibility.objects.get(user=current_user)
                return JSONResponse(
                    {
                        "role": "faculty",
                        "email": current_user.email,
                        "department": faculty.department,
                        "program": faculty.program,
                    }
                )
            except FacultyResponsibility.DoesNotExist:
                return JSONResponse(
                    {
                        "role": "faculty",
                        "email": current_user.email,
                        "department": None,
                        "program": None,
                    }
                )
        if current_user.role == "student":
            try:
                student = Student.objects.get(user=current_user)
                return JSONResponse(
                    {
                        "role": "student",
                        "email": current_user.email,
                        "department": student.department,
                        "academic_year": student.academic_year,
                    }
                )
            except Student.DoesNotExist:
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
    return JSONResponse({"message": "Logged out successfully."})

@login_required
def index(request):
    return render(request, "index.html")