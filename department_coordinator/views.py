from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from base.models import FacultyResponsibility, User
from base.permissions import ROLES, DepartmentScopedMixin, HasRole
from student.models import (
    Student,
    AcademicAttendanceSemester,
    AcademicPerformanceSemester,
    StudentOffer,
)
from program_coordinator_api.models import TrainingPerformanceCategory
from .utils import validate_file, importExcelAndReturnJSON
from django.db import models,transaction
from django.db.models import Avg, Count, Q, Max
from .serializers import DepartmentStudentSerializer
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from internship_api.models import InternshipAcceptance
import pandas as pd
import statistics
import re
import os
import traceback
from django.contrib.auth.hashers import make_password
from base.error_utils import safe_error_payload

DEFAULT_SEED_PASSWORD = os.getenv("DEFAULT_SEED_PASSWORD", "tcet@1234")
DEFAULT_STUDENT_PASSWORD_HASH = make_password(DEFAULT_SEED_PASSWORD)

def _extract_department_from_uid(uid):
    """Extract department code from UID like '24-AI&DSA01-28' -> 'AI&DSA'."""
    parts = str(uid).strip().split("-")
    if len(parts) >= 2:
        # The middle part usually contains dept code + number, e.g. 'AI&DSA01' or 'ITC70'
        middle = parts[1]
        # Strip trailing digits to get the department prefix
        dept = re.sub(r'\d+$', '', middle)
        return dept if dept else middle
    return "Unknown"


def _get_or_create_student(uid, department):
    """Get an existing student by UID or create a new User + Student record."""
    try:
        return Student.objects.get(uid=uid)
    except Student.DoesNotExist:
        # Build a placeholder email from the UID
        safe_uid = uid.lower().replace("&", "").replace(" ", "")
        email = f"{safe_uid}@student.tcet.ac.in"
        # Create the User with pre-computed hashed password to avoid timeouts
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": uid,
                "role": "student",
                "password": DEFAULT_STUDENT_PASSWORD_HASH,
            },
        )
        # Determine department from UID or fall back to coordinator's department
        dept = _extract_department_from_uid(uid) or department
        student = Student.objects.create(
            user=user,
            uid=uid,
            department=dept,
        )
        return student


from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class DepartmentStudentDataView(DepartmentScopedMixin, ListAPIView):
    permission_classes = [HasRole.of(*ROLES.DEPARTMENT)]
    serializer_class = DepartmentStudentSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Scoping is the permission layer's job now (T-10); it fails closed
        # when the coordinator has no department assigned.
        queryset = self.scope_to_department(Student.objects.all()).select_related(
            'user'
        ).prefetch_related(
            'academic_performance',
            'academic_attendance',
            'resume__activities_and_achievements',
            'student_offers__company',
            'student_offers__job_offer',
            'applied_companies__company',
            'applied_companies__job_offer',
            'applied_companies__application',
            'training_performance',
            'internship_offer_acceptance',
        ).order_by('uid')

        # Advanced search filter
        student_uid = self.request.query_params.get("uid")
        if student_uid:
            queryset = queryset.filter(uid__icontains=student_uid)
            
        batch = self.request.query_params.get("batch") or self.request.query_params.get("year")
        if batch:
            queryset = queryset.filter(batch=batch)

        return queryset
class AttendanceViewSet(DepartmentScopedMixin, viewsets.ViewSet):
    permission_classes = [HasRole.of(*ROLES.DEPARTMENT)]

    # FIXED (T-11): the previous `get_department_coordinator()` returned a
    # responsibility only when `role == "faculty"`, while the permission class
    # required `role == "department_coordinator"` - so the two conditions could
    # never both hold and BOTH upload endpoints answered 403 unconditionally.
    # Department scoping now comes from DepartmentScopedMixin, which keys off
    # the FacultyResponsibility row rather than the role string.

    @action(detail=False, methods=["post"])
    def upload_attendance(self, request):
        department = self.get_scoped_department()
        if department:
            if not validate_file(request.FILES.get("file_attendance")):
                return Response(
                    {"error": "Invalid file type. Please upload a CSV file."}, status=status.HTTP_400_BAD_REQUEST
                )

            try:
                df = importExcelAndReturnJSON(request.FILES.get("file_attendance"))
                imported_count = 0
                missing_uids = []

                # Pre-fetch relevant students in one batch to avoid N+1 queries
                uids = [str(record.get("uid")).strip() for record in df if record.get("uid")]
                students_map = {student.uid: student for student in Student.objects.filter(uid__in=uids)}

                with transaction.atomic():
                    # 1. Ensure all students exist (create if missing)
                    for record in df:
                        uid = record.get("uid")
                        if not uid: continue
                        uid = str(uid).strip()
                        if uid not in students_map:
                            students_map[uid] = _get_or_create_student(uid, department)

                    # 2. Pre-fetch existing attendance records to determine create vs update
                    existing_records = AcademicAttendanceSemester.objects.filter(
                        student__in=students_map.values()
                    )
                    record_map = { (r.student_id, r.semester): r for r in existing_records }

                    to_create = []
                    to_update = []
                    updated_students = set()

                    for record in df:
                        uid = record.get("uid")
                        semester = record.get("semester")
                        attendance = record.get("attendance")
                        
                        if not uid or not semester or attendance is None:
                            continue
                            
                        uid = str(uid).strip()
                        student = students_map[uid]
                        
                        key = (student.id, semester)
                        if key in record_map:
                            rec = record_map[key]
                            if rec.attendance != attendance:
                                rec.attendance = attendance
                                to_update.append(rec)
                        else:
                            new_rec = AcademicAttendanceSemester(
                                student=student,
                                semester=semester,
                                attendance=attendance
                            )
                            to_create.append(new_rec)
                            record_map[key] = new_rec
                            
                        updated_students.add(student)
                        imported_count += 1
                        
                    # 3. Execute bulk DB operations
                    if to_create:
                        AcademicAttendanceSemester.objects.bulk_create(to_create)
                    if to_update:
                        AcademicAttendanceSemester.objects.bulk_update(to_update, ['attendance'])

                    # 4. Calculate and save averages in a single fast query
                    if updated_students:
                        student_ids = [s.id for s in updated_students]
                        averages = AcademicAttendanceSemester.objects.filter(
                            student_id__in=student_ids
                        ).values('student_id').annotate(avg=models.Avg("attendance"))
                        
                        avg_map = { item['student_id']: item['avg'] for item in averages }
                        students_to_update = []
                        
                        for student in updated_students:
                            student.attendance = avg_map.get(student.id, 0)
                            students_to_update.append(student)
                            
                        Student.objects.bulk_update(students_to_update, ['attendance'])

                if missing_uids:
                    unique_missing = list(set(missing_uids))
                    return Response(
                        {
                            "message": f"Successfully imported {imported_count} records. Skipped {len(unique_missing)} unrecognized student UIDs.",
                            "skipped_uids": unique_missing,
                        },
                        status=status.HTTP_200_OK
                    )
                return Response({"message": "Data imported successfully"})
            except Exception as e:
                return Response(safe_error_payload(e), status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "No department is assigned to your account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["post"])
    def upload_performance(self, request):
        department = self.get_scoped_department()
        if department:
            if not validate_file(request.FILES.get("file_performance")):
                return Response(
                    {"error": "Invalid file type. Please upload a CSV file."}, status=status.HTTP_400_BAD_REQUEST
                )

            try:
                df = importExcelAndReturnJSON(request.FILES.get("file_performance"))
                imported_count = 0
                missing_uids = []

                # Pre-fetch relevant students in one batch to avoid N+1 queries
                uids = [str(record.get("uid")).strip() for record in df if record.get("uid")]
                students_map = {student.uid: student for student in Student.objects.filter(uid__in=uids)}

                with transaction.atomic():
                    # 1. Ensure all students exist (create if missing)
                    for record in df:
                        uid = record.get("uid")
                        if not uid: continue
                        uid = str(uid).strip()
                        if uid not in students_map:
                            students_map[uid] = _get_or_create_student(uid, department)

                    # 2. Pre-fetch existing performance records to determine create vs update
                    existing_records = AcademicPerformanceSemester.objects.filter(
                        student__in=students_map.values()
                    )
                    record_map = { (r.student_id, r.semester): r for r in existing_records }

                    to_create = []
                    to_update = []
                    updated_students = set()

                    for record in df:
                        uid = record.get("uid")
                        semester = record.get("semester")
                        performance = record.get("performance")
                        
                        if not uid or not semester or performance is None:
                            continue
                            
                        uid = str(uid).strip()
                        student = students_map[uid]
                        
                        key = (student.id, semester)
                        if key in record_map:
                            rec = record_map[key]
                            if rec.performance != performance:
                                rec.performance = performance
                                to_update.append(rec)
                        else:
                            new_rec = AcademicPerformanceSemester(
                                student=student,
                                semester=semester,
                                performance=performance
                            )
                            to_create.append(new_rec)
                            record_map[key] = new_rec
                            
                        updated_students.add(student)
                        imported_count += 1
                        
                    # 3. Execute bulk DB operations
                    if to_create:
                        AcademicPerformanceSemester.objects.bulk_create(to_create)
                    if to_update:
                        AcademicPerformanceSemester.objects.bulk_update(to_update, ['performance'])

                    # 4. Calculate and save CGPA averages in a single fast query
                    if updated_students:
                        student_ids = [s.id for s in updated_students]
                        averages = AcademicPerformanceSemester.objects.filter(
                            student_id__in=student_ids
                        ).values('student_id').annotate(avg=models.Avg("performance"))
                        
                        avg_map = { item['student_id']: item['avg'] for item in averages }
                        students_to_update = []
                        
                        for student in updated_students:
                            student.cgpa = avg_map.get(student.id, 0)
                            students_to_update.append(student)
                            
                        Student.objects.bulk_update(students_to_update, ['cgpa'])

                if missing_uids:
                    unique_missing = list(set(missing_uids))
                    return Response(
                        {
                            "message": f"Successfully imported {imported_count} records. Skipped {len(unique_missing)} unrecognized student UIDs.",
                            "skipped_uids": unique_missing,
                        },
                        status=status.HTTP_200_OK
                    )
                return Response({"message": "Data imported successfully"})
            except Exception as e:
                return Response(safe_error_payload(e), status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "No department is assigned to your account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

@api_view(['POST'])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([HasRole.of(*ROLES.DEPARTMENT)])
def upload_inhouse_internship(request):
    # Was gated on merely *having* a FacultyResponsibility with a department,
    # so any faculty member could bulk-create internship acceptance records.
    # The role check is now declarative; this only resolves the scope.
    responsibility = FacultyResponsibility.objects.filter(user=request.user).first()
    department = responsibility.department if responsibility else None
    if not department and not request.user.is_superuser:
        return Response(
            {"error": "No department is assigned to your account."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    if not file.name.endswith('.csv'):
        return Response({'error': 'Only CSV files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Read CSV file
        df = pd.read_csv(file)

        # Validate required columns
        required_columns = [
            'uid', 'year', 'type', 'stipend', 'is_verified', 'domain_name', 'total_hours', 'start_date', 'end_date'
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                'error': f'Missing required columns: {", ".join(missing_columns)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate data types and formats
        try:
            df['start_date'] = pd.to_datetime(df['start_date'])
            df['end_date'] = pd.to_datetime(df['end_date'])
            df['stipend'] = pd.to_numeric(df['stipend'])
            df['total_hours'] = pd.to_numeric(df['total_hours'])
            df['is_verified'] = df['is_verified'].astype(str).str.lower().map({'true': True, 'false': False})
            if df['is_verified'].isnull().any():
                raise ValueError('is_verified must be true or false')
        except Exception as e:
            return Response({
                'error': f'Invalid data format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Process each row
        success_count = 0
        error_rows = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    student = Student.objects.get(uid=row['uid'])
                    # Match the department itself or any of its divisions
                    # ("IT" -> "IT" or "IT-A") the same way DepartmentScopedMixin
                    # does - a bare startswith("IT") would also admit "ITC".
                    student_department = (student.department or "").strip().lower()
                    dept_lower = department.strip().lower() if department else None
                    if dept_lower and student_department != dept_lower and not student_department.startswith(f"{dept_lower}-"):
                        error_rows.append({
                            'row': index + 2,
                            'error': f'Student {row["uid"]} does not belong to your department'
                        })
                        continue
                    InternshipAcceptance.objects.create(
                        student=student,
                        year=row['year'],
                        type=row['type'],
                        salary=float(row['stipend']),
                        is_verified=row['is_verified'],
                        domain_name=row['domain_name'],
                        total_hours=int(row['total_hours']),
                        start_date=row['start_date'],
                        completion_date=row['end_date'],
                        offer_type='in_house',
                        company_name="Inhouse"  # or set as needed
                    )
                    success_count += 1
                except Student.DoesNotExist:
                    error_rows.append({
                        'row': index + 2,
                        'error': f'Student with ID {row["uid"]} not found'
                    })
                except Exception as e:
                    error_rows.append({
                        'row': index + 2,
                        'error': str(e)
                    })

        return Response({
            'message': f'Successfully processed {success_count} records',
            'errors': error_rows if error_rows else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Error processing file: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DepartmentDashboardSummaryView(DepartmentScopedMixin, APIView):
    permission_classes = [HasRole.of(*ROLES.DEPARTMENT)]

    def get(self, request):
        try:
            department = self.get_scoped_department()
            students_qs = self.scope_to_department(Student.objects.all())
            batches = students_qs.values_list('batch', flat=True).distinct().order_by('-batch')

            summary_by_batch = {}
            all_batches_consent = []
            for batch in batches:
                batch_students = students_qs.filter(batch=batch)
                total_students = batch_students.count()

                if total_students == 0:
                    continue
                academic_and_consent_data = batch_students.aggregate(
                    total_students=Count('id'),
                    average_cgpa=Avg('cgpa'),
                    students_with_kt=Count('id', filter=Q(is_kt=True)),

                    consent_placement=Count('id', filter=Q(consent__startswith='placement')),
                    consent_higher_studies=Count('id', filter=Q(consent='Higher studies')),
                    consent_entrepreneurship=Count('id', filter=Q(consent='Entrepreneurship'))
                )
                placed_offers = StudentOffer.objects.filter(
                    student__in=batch_students,
                    status__in=['accepted', 'joined']
                )

                placed_student_ids = placed_offers.values_list('student_id', flat=True).distinct()
                actual_placed_count = len(placed_student_ids)
                salary_data = placed_offers.aggregate(
                    average_salary=Avg('salary'),
                    highest_salary=Max('salary')
                )
                salaries = list(placed_offers.values_list('salary', flat=True))
                median_salary = 0
                if salaries:
                    median_salary = statistics.median(salaries)
                internship_data = InternshipAcceptance.objects.filter(
                    student__in=batch_students
                ).aggregate(
                    total_internships=Count('id'),
                    in_house_internships=Count('id', filter=Q(offer_type='in_house')),
                    outhouse_internships=Count('id', filter=~Q(offer_type='in_house'))
                )
                training_data = TrainingPerformanceCategory.objects.filter(
                    performance__student__in=batch_students
                ).values(
                    'category_name'
                ).annotate(
                    average_marks=Avg('marks')
                ).order_by('category_name')

                training_stats = {
                    item['category_name']: round(item['average_marks'], 2)
                    for item in training_data if item['average_marks'] is not None
                }
                summary_by_batch[batch] = {
                    "total_students": total_students,
                    "average_cgpa": round(academic_and_consent_data['average_cgpa'] or 0, 2),
                    "students_with_kt": academic_and_consent_data['students_with_kt'],
                    "consent_breakdown": {
                        "placement": academic_and_consent_data['consent_placement'],
                        "higher_studies": academic_and_consent_data['consent_higher_studies'],
                        "entrepreneurship": academic_and_consent_data['consent_entrepreneurship'],
                    },
                    "placement_stats": {
                        "actual_placed_count": actual_placed_count,
                        "average_salary_lpa": round((salary_data['average_salary'] or 0) / 100000, 2),
                        "median_salary_lpa": round(median_salary / 100000, 2), # <-- Use Python variable
                        "highest_salary_lpa": round((salary_data['highest_salary'] or 0) / 100000, 2),
                    },
                    "internship_stats": {
                        "total_internships": internship_data['total_internships'],
                        "in_house": internship_data['in_house_internships'],
                        "outhouse": internship_data['outhouse_internships'],
                    },
                    "training_stats": training_stats
                }
            overall_consent = students_qs.values('consent').annotate(count=Count('id')).order_by()
            consent_chart_data = [{"name": item['consent'], "value": item['count']} for item in overall_consent]
            top_companies = self.scope_to_department(
                StudentOffer.objects.filter(status__in=['accepted', 'joined']),
                field="student__department",
            ).values('company__name').annotate(hires_count=Count('id')).order_by('-hires_count')[:10]

            company_chart_data = [{"company_name": item['company__name'], "hires": item['hires_count']} for item in top_companies]
            overall_training_stats = self.scope_to_department(
                TrainingPerformanceCategory.objects.all(),
                field="performance__student__department",
            ).values('category_name').annotate(
                average_marks=Avg('marks')
            ).order_by('category_name')

            overall_training_summary = {
                item['category_name']: round(item['average_marks'], 2)
                for item in overall_training_stats if item['average_marks'] is not None
            }
            response_data = {
                "department_name": department,
                "summary_by_batch": summary_by_batch,
                "overall_consent_summary": consent_chart_data,
                "overall_top_companies": company_chart_data,
                "overall_training_summary": overall_training_summary
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(safe_error_payload(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)