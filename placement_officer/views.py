from django.db.models import Count, Q, Case, When, Sum,FloatField,Avg, Value, CharField
from django.db.models.functions import TruncMonth, Cast
from django.http import JsonResponse
import json
from placement_officer.models import CategoryRule
from student.models import Student
from datetime import datetime
from student.utils import categorize
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from staff.models import JobOffer,CompanyRegistration
from collections import defaultdict
from student.models import StudentOffer,StudentPlacementAppliedCompany,PlacementCompanyProgress
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.response import Response
from rest_framework import status
from .pagination import StandardResultsSetPagination
from .serializers import StudentDetailReportSerializer

@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def extract_year_from_uid(uid):
    """Extract batch year from UID."""
    try:
        return int(uid.split("-")[-1]) + 2000
    except ValueError:
        return None


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_current_year():
    """Get the current year."""
    return datetime.now().year


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def statistic(request, year=None):
    year = year or get_current_year()
    batch_year_suffix = str(year)[-2:]
    try:
        consent_graph = list(
            Student.objects.all().values("consent").annotate(count=Count("consent"))
        )
        consent_counts_by_branch = list(
            Student.objects.all().values("department").annotate(count=Count("consent"))
        )
    except Exception as e:
        print(f"Error reading data from database: {e}")
        consent_graph = []
        consent_counts_by_branch = []

    context = {
        "consent_graph": json.dumps(consent_graph),
        "consent_counts_by_branch": json.dumps(consent_counts_by_branch),
    }
    return JsonResponse(context)


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def filter_by_department(request, department, year=None):
    year = year or get_current_year()
    batch_year_suffix = str(year)[-2:]
    try:
        filtered_data = list(
            Student.objects.filter(department=department)
            .values("consent")
            .annotate(count=Count("consent"))
        )
    except Exception as e:
        print(f"Error filtering data by department: {e}")
        filtered_data = []

    return JsonResponse({"filtered_data": json.dumps(filtered_data)})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_unique_departments(request, year=None):
    year = year or get_current_year()
    batch_year_suffix = str(year)[-2:]
    try:
        unique_departments = list(
            Student.objects.all().values_list("department", flat=True).distinct()
        )
    except Exception as e:
        print(f"Error fetching unique departments: {e}")
        unique_departments = []

    return JsonResponse({"unique_departments": unique_departments})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_category(request, year=None):
    year = year or get_current_year()
    batch_year_suffix = str(year)[-2:]
    try:
        category = list(
            Student.objects.filter(academic_year="BE")
            .values("current_category")
            .annotate(count=Count("current_category"))
        )
    except Exception as e:
        print(f"Error fetching category data: {e}")
        category = []

    return JsonResponse({"category": category})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_category_by_department(request, department, year=None):
    year = year or get_current_year()
    batch_year_suffix = str(year)[-2:]
    try:
        category = list(
            Student.objects.filter(department=department)
            .values("current_category")
            .annotate(count=Count("current_category"))
        )
    except Exception as e:
        print(f"Error filtering category by department: {e}")
        category = []
    return JsonResponse({"category": category})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_data_by_year(request, year):
    try:
        batch_year_suffix = str(year)[-2:]
        students = Student.objects.filter(uid__regex=f"^.*-{batch_year_suffix}$")
        student_data = list(students.values("uid", "department", "consent"))
        print(f"Students for year {year}: {student_data}")
    except Exception as e:
        print(f"Error fetching data for year {year}: {e}")
        student_data = []
    return JsonResponse({"data": student_data})


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def calculateCategory(request):
    try:
        batch = request.data.get(
            "batch", "BE_2024"
        )  # Get batch from request or use default
        students = Student.objects.filter(academic_year="BE")

        for student in students:
            # Calculate averages
            academic_attendance = calculate_average(
                student.academic_attendance, "attendance"
            )
            academic_performance = calculate_average(
                student.academic_performance, "performance"
            )
            training_attendance = calculate_average(
                student.training_attendance, "training_attendance"
            )
            training_performance = calculate_average(
                student.training_performance, "training_performance"
            )

            # Calculate category using the new dynamic rules
            category = categorize(
                academic_attendance,
                academic_performance,
                training_attendance,
                training_performance,
                batch,
            )

            student.current_category = category
            student.save()

        return JsonResponse({"success": "Category calculated successfully"}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=500)


def calculate_average(queryset, field_name):
    sum_value = queryset.aggregate(Sum(field_name)).get(f"{field_name}__sum")
    count = queryset.count()
    return sum_value / count if sum_value is not None and count > 0 else None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_category_rule(request):
    try:
        CategoryRule.objects.create(**request.data)
        return JsonResponse(
            {"message": "Category rule created successfully"}, status=201
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_category_rules(request):
    rules = CategoryRule.objects.all().values()
    return Response(list(rules))  # Convert to list here as well for consistency


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def students_by_category(request, category, batch):
    try:
        students = Student.objects.filter(current_category=category, batch=batch)
        student_data = students.values("id", "current_category", "academic_year")
        return Response(list(student_data))  # Convert ValuesQuerySet to list
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConsolidationReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, batch, *args, **kwargs):
        departments = [
            "COMP", "IT", "AI&DS", "AI&ML", "IoT", "CS&E",
            "E&CS", "E&TC", "Mech", "MME", "CIVIL"
        ]

        annotations_to_add = {}
        for dept in departments:
            dept_key = dept.lower().replace('&', '').replace(' ', '_').replace('-', '_')

            annotations_to_add[f'applied_{dept_key}'] = Count(
                'offer',
                filter=Q(offer__student__department=dept, offer__student__batch=batch),
                distinct=True
            )

            annotations_to_add[f'selected_{dept_key}'] = Count(
                'student_offers',
                filter=Q(student_offers__student__department=dept),
                distinct=True
            )

        base_fields = [
            'id',
            'role',
            'salary',
            'form__name',
            'form__notice__date',
            'form__is_aedp_or_pli'
        ]

        report_data = (
            JobOffer.objects
            .select_related('form', 'form__notice')
            .annotate(**annotations_to_add)
            .values(*base_fields, *annotations_to_add.keys())
        )
        report_list = []
        for item in report_data:
            salary = int(item.get("salary") or 0)
            if salary < 500000:
                emp_type = "Normal"
            elif salary < 1000000:
                emp_type = "Dream"
            else:
                emp_type = "Super Dream"
            item["employee_type"] = emp_type
            report_list.append(item)
        return Response(report_list)

class PlacementDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, batch, *args, **kwargs):
        offers = StudentOffer.objects.filter(student__batch=batch).annotate(
            salary_float=Cast('salary', FloatField())
        )
        offer_category_case = Case(
            When(salary_float__lt=5, then=Value('Normal')),
            When(salary_float__gte=5, salary_float__lte=10, then=Value('Dream')),
            When(salary_float__gt=10, then=Value('Super Dream')),
            default=Value('N/A'),
            output_field=CharField(),
        )

        salary_histogram_case = Case(
            When(salary_float__lt=5, then=Value('0-5 LPA')),
            When(salary_float__gte=5, salary_float__lt=7, then=Value('5-7 LPA')),
            When(salary_float__gte=7, salary_float__lt=10, then=Value('7-10 LPA')),
            When(salary_float__gte=10, salary_float__lt=15, then=Value('10-15 LPA')),
            When(salary_float__gte=15, then=Value('15+ LPA')),
            default=Value('Other'),
            output_field=CharField(),
        )

        placements_over_time_query = offers.annotate(
            month=TruncMonth('offer_date')
        ).values('month').annotate(
            placements=Count('id')
        ).order_by('month')

        placements_over_time = [
            {'month': item['month'].strftime('%b %Y'), 'placements': item['placements']}
            for item in placements_over_time_query
        ]

        department_performance = list(
            Student.objects.filter(batch=batch)
            .values('department')
            .annotate(
                total=Count('id'),
                placed=Count('student_offers', distinct=True),
                avg_salary=Avg('student_offers__salary'),
            )
            .order_by('-placed')
        )

        salary_distribution = list(
            offers.annotate(range=salary_histogram_case)
            .values('range')
            .annotate(count=Count('id'))
            .order_by('range')
        )

        offer_category_breakdown = list(
            offers.annotate(name=offer_category_case)
            .values('name')
            .annotate(value=Count('id'))
            .order_by('name')
        )

        total_students = Student.objects.filter(batch=batch).count()
        placed_students = (
            Student.objects.filter(batch=batch, student_offers__isnull=False)
            .distinct()
            .count()
        )

        placement_status_funnel = [
            {"name": "Total Students", "value": total_students},
            {"name": "Placed", "value": placed_students},
            {"name": "Unplaced", "value": total_students - placed_students},
        ]

        top_recruiters = list(
            offers.values('company__name')
            .annotate(hires=Count('student_id', distinct=True))
            .order_by('-hires')[:10]
        )

        top_job_roles = list(
            offers.values('role')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        dashboard_data = {
            "placementsOverTime": placements_over_time,
            "departmentPerformance": department_performance,
            "salaryDistribution": salary_distribution,
            "offerCategoryBreakdown": offer_category_breakdown,
            "placementStatusFunnel": placement_status_funnel,
            "topRecruiters": top_recruiters,
            "topJobRoles": top_job_roles,
        }
        return Response(dashboard_data)


class BranchwiseReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, batch, *args, **kwargs):

        companies = CompanyRegistration.objects.filter(batch=batch)
        company_map = {c.id: c.name for c in companies}

        departments = Student.objects.filter(batch=batch).values_list(
            'department', flat=True
        ).distinct().order_by('department')
        progress_fields = [
            'registered', 'aptitude_test', 'coding_test',
            'technical_interview', 'hr_interview', 'gd'
        ]
        def default_counts():
            counts = {field: 0 for field in progress_fields}
            counts['final'] = 0
            return counts

        report_data = defaultdict(lambda: defaultdict(default_counts))
        applications = StudentPlacementAppliedCompany.objects.filter(
            student__batch=batch
        ).select_related(
            'student', 'company', 'application'
        )
        for app in applications:
            dept = app.student.department
            comp_id = app.company_id

            if comp_id not in company_map:
                continue

            try:
                progress = app.application
                for field in progress_fields:
                    if getattr(progress, field):
                        report_data[dept][comp_id][field] += 1

            except StudentPlacementAppliedCompany.application.RelatedObjectDoesNotExist:
                continue

        offers = StudentOffer.objects.filter(student__batch=batch).select_related('student')

        for offer in offers:
            dept = offer.student.department
            comp_id = offer.company_id

            if comp_id in company_map:
                report_data[dept][comp_id]['final'] += 1

        final_report = []
        for dept in departments:
            row = {'department': dept}
            for comp_id in company_map.keys():
                counts = report_data[dept][comp_id]
                for field in progress_fields:
                    row[f'company_{comp_id}_{field}'] = counts[field]
                row[f'company_{comp_id}_final'] = counts['final']
            final_report.append(row)

        all_report_fields = progress_fields + ['final']

        return Response({
            'company_headers': list(companies.values('id', 'name')),
            'progress_fields': all_report_fields,
            'report_data': final_report
        })



class StudentDetailReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    def get(self, request, batch, *args, **kwargs):
        department = request.query_params.get('department', None)
        companies = list(CompanyRegistration.objects.filter(batch=batch))
        students_qs = Student.objects.filter(
            batch=batch
        ).select_related('user').prefetch_related(
            'student_offers__company',
            'applied_companies__application'
        ).order_by('uid')
        if department:
            students_qs = students_qs.filter(department=department)
        paginator = self.pagination_class()
        paginated_students = paginator.paginate_queryset(students_qs, request, view=self)
        all_progress = PlacementCompanyProgress.objects.filter(
            application__student_id__in=[s.id for s in paginated_students]
        ).select_related('application')
        progress_by_student = defaultdict(list)
        for p in all_progress:
            progress_by_student[p.application.student_id].append(p)
        for s in paginated_students:
            s.all_progress = progress_by_student[s.id]
        serializer_context = {
            'request': request,
            'companies': companies
        }
        serializer = StudentDetailReportSerializer(
            paginated_students,
            many=True,
            context=serializer_context
        )
        return paginator.get_paginated_response(serializer.data)