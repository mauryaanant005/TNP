from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_avg_data(request, table_name):
    try:
        # Validate table_name to prevent SQL injection
        valid_tables = [
            "program1",
            "another_program_table",
        ]  # Add valid table names here
        if table_name not in valid_tables:
            return JsonResponse({"error": "Invalid table name"}, status=400)

        # Construct query to fetch average attendance and performance by Branch_Div
        query = f"""
        SELECT Branch_Div,
               Year,
               Program_name,
               AVG(training_attendance) AS avg_attendance,
               AVG(training_performance) AS avg_performance
        FROM {table_name}
        GROUP BY Branch_Div, Year, Program_name
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            # Convert the rows into a list of dictionaries
            columns = [col[0] for col in cursor.description]
            result = [dict(zip(columns, row)) for row in rows]

        return JsonResponse(result, safe=False)

    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to fetch average data: {str(e)}"}, status=500
        )
