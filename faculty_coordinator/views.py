# attendance/views.py
from django.http import JsonResponse
from django.db import connection
from datetime import datetime
import json
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from base.permissions import ROLES, HasRole
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from base.models import User, FacultyResponsibility
from base.error_utils import safe_error_payload


def execute_query(query, params=None, fetch_all=True):
    """Helper function to execute raw SQL queries."""
    with connection.cursor() as cursor:
        cursor.execute(query, params or [])
        if fetch_all:
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return results
        else:
            return cursor.rowcount


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([HasRole.of(*ROLES.TRAINING_DELIVERY)])
def get_program_data(request):
    user = request.user
    try:
        programs = list(
            FacultyResponsibility.objects.filter(user=user)
            .exclude(program__isnull=True)
            .exclude(program="")
            .values_list("program", flat=True)
        )
        if not programs:
            return JsonResponse([], safe=False, status=200)
        placeholders = ", ".join(["%s"] * len(programs))
        query = f"SELECT * FROM attendance_attendancerecord WHERE program_name IN ({placeholders})"
        data = execute_query(query, programs)
        return JsonResponse(data, safe=False, status=200)
    except Exception as e:
        return JsonResponse(safe_error_payload(e), status=500)


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
import json


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([HasRole.of(*ROLES.TRAINING_DELIVERY)])
def save_attendance(request):
    try:
        attendance_records = request.data.get("students", [])
        if not attendance_records:
            return JsonResponse({"error": "No attendance data provided"}, status=400)

        for record in attendance_records:
            query = """
                INSERT INTO attendance_data (
                    program_name, session, uid, name, year, batch, present, late, timestamp,semester
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s,%s)
                ON DUPLICATE KEY UPDATE
                    present = VALUES(present),
                    late = VALUES(late),
                    timestamp = VALUES(timestamp);
            """
            params = (
                record.get("ProgramName"),
                record.get("Session"),
                record.get("UID"),
                record.get("Name"),
                record.get("Year"),
                record.get("Batch"),
                record.get("Present", "Absent"),
                record.get("Late", "Not Late"),
                datetime.now(),
                record.get("semester"),
            )
            execute_query(query, params, fetch_all=False)

        return JsonResponse(
            {"message": "Attendance data saved successfully"}, status=200
        )
    except Exception as e:
        return JsonResponse(safe_error_payload(e), status=500)


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([HasRole.of(*ROLES.TRAINING_DELIVERY)])
def get_attendance(request):
    """Fetch saved attendance records."""
    try:
        programs = list(
            FacultyResponsibility.objects.filter(user=request.user)
            .exclude(program__isnull=True)
            .exclude(program="")
            .values_list("program", flat=True)
        )
        if not programs:
            return JsonResponse([], safe=False, status=200)
        placeholders = ", ".join(["%s"] * len(programs))
        query = f"SELECT * FROM attendance_attendancerecord WHERE program_name IN ({placeholders})"
        data = execute_query(query, programs)
        return JsonResponse(data, safe=False, status=200)
    except Exception as e:
        return JsonResponse(safe_error_payload(e), status=500)


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([HasRole.of(*ROLES.TRAINING_DELIVERY)])
def reset_attendance(request):
    """Reset attendance records for the requesting coordinator's own program(s) only."""
    try:
        programs = list(
            FacultyResponsibility.objects.filter(user=request.user)
            .exclude(program__isnull=True)
            .exclude(program="")
            .values_list("program", flat=True)
        )
        if not programs:
            return JsonResponse({"message": "No assigned program to reset"}, status=200)
        placeholders = ", ".join(["%s"] * len(programs))
        query = f"DELETE FROM attendance_attendancerecord WHERE program_name IN ({placeholders})"
        execute_query(query, programs, fetch_all=False)
        return JsonResponse(
            {"message": "Attendance table reset successfully"}, status=200
        )
    except Exception as e:
        return JsonResponse(safe_error_payload(e), status=500)