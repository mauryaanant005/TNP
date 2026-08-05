import json
import logging
from base.error_utils import safe_error_payload
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from rest_framework.generics import RetrieveAPIView
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from .models import (
    Student,
    Resume,
    StudentPlacementAppliedCompany,
    PlacementCompanyProgress,
    StudentOffer
)

logger = logging.getLogger(__name__)
from .serializers import (
    ResumeSerializer,
    SessionAttendanceSerializer,
    StudentSerializer,
    InternshipAcceptanceSerializer,
)

from program_coordinator_api.models import (
    AttendanceData,
)
from .utils import is_student_eligible
from staff.models import CompanyRegistration,JobOffer
from internship_api.models import InternshipAcceptance
from program_coordinator_api.models import TrainingPerformance, TrainingPerformanceCategory

class StudentTrainingPerformanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get current logged-in student's UID
            student = get_object_or_404(Student, user=request.user)
            uid = student.uid

            # Fetch all TrainingPerformance records for this UID
            performances = TrainingPerformance.objects.filter(student=student).prefetch_related("categories")

            if not performances.exists():
                return Response(
                    {"message": "No training performance records found for this student."},
                    status=status.HTTP_200_OK
                )

            # Build clean minimal response
            data = {
                "uid": uid,
                "training_performance": [],
            }

            for perf in performances:
                # Get all category marks for this training type
                categories = perf.categories.all()
                category_data = [
                    {"category_name": c.category_name, "marks": c.marks}
                    for c in categories
                ]

                data["training_performance"].append({
                    "training_type": perf.training_type,
                    "categories": category_data,
                    "semester": perf.semester,
                    "date": perf.date,
                })

            return Response(data, status=status.HTTP_200_OK)

        except Http404:
            return Response(
                {"error": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.exception("StudentTrainingPerformanceAPIView error")
            return Response(
                safe_error_payload(e),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



class StudentDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            response_serializer = StudentSerializer(student)
            student_data = response_serializer.data
            return Response({"student": student_data})
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(safe_error_payload(e), status=status.HTTP_400_BAD_REQUEST)


class SessionAttendanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            attendance_data = AttendanceData.objects.filter(
                uid=student.uid
            )

            serializer = SessionAttendanceSerializer(
                attendance_data, many=True
            )  # Serialize data
            return Response(serializer.data)  # Return JSON response
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)


class StudentProfileView(RetrieveAPIView):
    serializer_class = StudentSerializer

    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user

        try:
            student_profile = Student.objects.select_related(
                'user'
            ).prefetch_related(
                'academic_performance',
                'academic_attendance',
            ).get(user=user) # The key filter: user=request.user

            return student_profile

        except Student.DoesNotExist:
            raise Http404("No Student profile found for this user.")

class ResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            resume = Resume.objects.get(student=student)
            serializer = ResumeSerializer(resume)
            return Response(serializer.data)
        except Resume.DoesNotExist:
            return Response(
                {"message": "Resume not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        try:
            student = Student.objects.get(user=request.user)
            data_str = request.data.get('data')
            if not data_str:
                return Response({'data': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                return Response({'data': 'Invalid JSON string.'}, status=status.HTTP_400_BAD_REQUEST)
            profile_image = request.data.get('profile_image')
            if profile_image:
                data['profile_image'] = profile_image
            serializer = ResumeSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(student=student)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                safe_error_payload(e),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        try:
            data_str = request.data.get('data')
            if not data_str:
                return Response({'data': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                return Response({'data': 'Invalid JSON string.'}, status=status.HTTP_400_BAD_REQUEST)
            profile_image = request.data.get('profile_image')
            if profile_image:
                data['profile_image'] = profile_image
            student = Student.objects.get(user=request.user)
            resume = Resume.objects.get(student=student)
            serializer = ResumeSerializer(
            instance=resume,
            data=data,
            context={'request': request},
            partial=True
        )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Resume.DoesNotExist:
            return Response(
                {"message": "Resume not found"}, status=status.HTTP_404_NOT_FOUND
            )

class PlacementCompanyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            try:
                student = Student.objects.get(user=request.user)
            except Student.DoesNotExist:
                return Response(
                    {"message": "You can't fill this form"},
                    status=status.HTTP_404_NOT_FOUND
                )

            data = request.data
            interest = data.get("interest", "").strip().lower()
            company_id = data.get("company_id")

            if not company_id:
                return Response(
                    {"message": "Company ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            company = get_object_or_404(CompanyRegistration, id=company_id)
            if StudentPlacementAppliedCompany.objects.filter(student=student, company=company).exists():
                return Response(
                    {"message": "You have already responded for this company"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if interest in ["no", "false"]:
                reason = data.get("reason", "").strip()
                if not reason:
                    return Response(
                        {"message": "Please provide a reason"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                StudentPlacementAppliedCompany.objects.create(
                    student=student,
                    company=company,
                    job_offer=None,
                    interested=False,
                    not_interested_reason=reason
                )

                return Response(
                    {"message": "Response recorded"},
                    status=status.HTTP_201_CREATED
                )
            offer_role = data.get("offer_role", "").strip()
            if not offer_role:
                return Response(
                    {"message": "Offer role is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                offer = JobOffer.objects.get(form=company, role=offer_role)
            except JobOffer.DoesNotExist:
                return Response(
                    {"message": "Invalid job offer role"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            is_eligible = is_student_eligible(student, company,offer)
            if not is_eligible:
                return Response(
                    {"message": "You are not eligible for this company"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            applied=StudentPlacementAppliedCompany.objects.create(
                student=student,
                company=company,
                job_offer=offer,
                interested=True,
                not_interested_reason=""
            )
            PlacementCompanyProgress.objects.get_or_create(
                application=applied
            )
            return Response(
                {"message": "You are registered"},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                safe_error_payload(e),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlacementCard(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        try:
            student = get_object_or_404(Student, user=request.user)
        except Student.DoesNotExist:
            return Response(
                {"error": "No student profile found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )
        applications_qs = StudentPlacementAppliedCompany.objects.filter(
            student=student
        ).select_related(
            'company',
            'job_offer',
            'application'
        )

        applied_companies_data = []
        for app in applications_qs:

            job_offer_details = None
            if app.job_offer:
                job_offer_details = {
                    "id": app.job_offer.id,
                    "role": getattr(app.job_offer, 'role', str(app.job_offer.id))
                }

            progress_details = {}
            try:
                progress = app.application
                progress_details = {
                    "id": progress.id,
                    "registered": progress.registered,
                    "aptitude_test": progress.aptitude_test,
                    "coding_test": progress.coding_test,
                    "technical_interview": progress.technical_interview,
                    "hr_interview": progress.hr_interview,
                    "gd": progress.gd,
                    "final_result": progress.final_result,
                }
            except PlacementCompanyProgress.DoesNotExist:
                progress_details = {
                    "id": None,
                    "registered": False,
                    "aptitude_test": False,
                    "coding_test": False,
                    "technical_interview": False,
                    "hr_interview": False,
                    "gd": False,
                    "final_result": "Pending",
                }

            app_data = {
                "application_id": app.id,
                "company_id": app.company.id,
                "company_name": app.company.name,
                "job_offer": job_offer_details,
                "interested": app.interested,
                "not_interested_reason": app.not_interested_reason,
                "application_date": app.application_date.isoformat(),
                "progress": progress_details
            }
            applied_companies_data.append(app_data)
        offers_qs = StudentOffer.objects.filter(
            student=student
        ).select_related(
            'company',
            'job_offer'
        )
        offers_data = []
        for offer in offers_qs:
            job_offer_details = None
            if offer.job_offer:
                job_offer_details = {
                    "id": offer.job_offer.id,
                    "role": getattr(offer.job_offer, 'role', str(offer.job_offer.id))
                }
            offer_data = {
                "offer_id": offer.id,
                "company_id": offer.company.id,
                "company_name": offer.company.name,
                "job_offer": job_offer_details,
                "offer_type": offer.get_offer_type_display(),
                "status": offer.get_status_display(),
                "salary": offer.salary,
                "role": offer.role,
                "offer_date": offer.offer_date.isoformat(),
                "is_aedp_pli": offer.is_aedp_pli,
                "is_aedp_ojt": offer.is_aedp_ojt,
            }
            offers_data.append(offer_data)
        response_data = {
            "applications": applied_companies_data,
            "offers": offers_data,
            "academic_year": student.academic_year,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class StudentInternshipListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InternshipAcceptanceSerializer

    def get_queryset(self):
        try:
            student = Student.objects.get(user=self.request.user)
            return InternshipAcceptance.objects.filter(student=student)
        except Student.DoesNotExist:
            return InternshipAcceptance.objects.none()


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        try:
            # User delete cascades to Student, Resume, Offers, etc.
            user.delete()
            return Response({"message": "Account successfully deleted"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(safe_error_payload(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)