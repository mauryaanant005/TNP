from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CompanyRegistration
from .serializers import (
    FormDataSerializer,
    InterestedStudentApplicationSerializer,
    NotInterestedStudentApplicationSerializer,
    BasicStudentSerializer,
)
from .utils import get_eligible_students
from notifications.serializers import NotificationSerializer
from django.db import transaction
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from student.models import Student
from notifications.models import Notification
from dotenv import load_dotenv
from student.models import (
    StudentPlacementAppliedCompany,
    PlacementCompanyProgress,
    StudentOffer,
)
from program_coordinator_api.models import AttendanceData, TrainingPerformanceCategory
from django.db.models import Avg
from student.serializers import StudentSerializer
from celery.result import AsyncResult
from .tasks import generate_excel_export_task, generate_resume_zip_task
from rest_framework.permissions import IsAuthenticated

import os


class CompanyListCreateView(generics.CreateAPIView):
    queryset = CompanyRegistration.objects.all()
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated]


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FormDataSerializer
    lookup_field = "id"
    permission_classes = [IsAuthenticated]

    def get_object(self):
        company_id = self.kwargs.get("id")
        return CompanyRegistration.objects.get(id=company_id)


class CompanyByBatchView(generics.ListAPIView):
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        batch = self.kwargs.get("batch")
        return CompanyRegistration.objects.filter(batch=batch)


class CompanyBatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        batches = CompanyRegistration.objects.values_list("batch", flat=True).distinct()
        return Response(batches)


class SendPlacementNotificationApiView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    lookup_field = "id"
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            load_dotenv()
            title = request.data.get("title")
            content = request.data.get("content")
            sendto = request.data.get("sendTo")
            company_id = self.kwargs.get("id")
            company = get_object_or_404(CompanyRegistration, id=company_id)
            if sendto == "eligible":
                eligible_student_ids = get_eligible_students(company)
                if not eligible_student_ids:
                    return Response(
                        {"message": "No eligible students found for this company."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                students = Student.objects.filter(id__in=eligible_student_ids)
                recipients = [student.user for student in students]
                message = (
                    f"{content}\n\n"
                    f"Dear Student,\n\nYou are eligible to apply for placement at {company.name}.\n"
                    f"Apply link: {os.getenv('CLIENT_URL')}/student/placement/registration/{company.id}\n\nBest regards,\nTraining and Placement Team"
                )
            elif sendto == "registered":
                applications = StudentPlacementAppliedCompany.objects.filter(
                    company=company, interested=True
                ).select_related("student")
                recipients = [app.student.user for app in applications]
                message = (
                    f"{content}\n\n"
                    f"Dear Student,\n\nThis is a notification regarding your application for placement at {company.name}.\n"
                    f"Please check your dashboard for more details.\n\nBest regards,\nTraining and Placement Team"
                )
            print(f"Recipients count: {len(recipients)}")
            notification = Notification.objects.create(
                title=title,
                message=message,
                creator=request.user,
                type_notification="placement",
            )

            notification.recipients.set(recipients)

            serializer = self.get_serializer(notification)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Error sending placement notification:", str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class PaginatedInterestedStudentsView(generics.ListAPIView):
    serializer_class = InterestedStudentApplicationSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company_id = self.kwargs["company_id"]
        company = get_object_or_404(CompanyRegistration, id=company_id)
        result = StudentPlacementAppliedCompany.objects.filter(
            company=company, interested=True
        ).select_related("application")
        return result


class PaginatedNotInterestedStudentsView(generics.ListAPIView):
    serializer_class = NotInterestedStudentApplicationSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company_id = self.kwargs["company_id"]
        company = get_object_or_404(CompanyRegistration, id=company_id)

        return StudentPlacementAppliedCompany.objects.filter(
            company=company, interested=False
        )


class EligibleButNotRegisteredView(generics.ListAPIView):
    serializer_class = BasicStudentSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company_id = self.kwargs["company_id"]
        company = get_object_or_404(CompanyRegistration, id=company_id)

        eligible_student_ids = set(get_eligible_students(company))
        registered_student_ids = set(
            StudentPlacementAppliedCompany.objects.filter(company=company).values_list(
                "student_id", flat=True
            )
        )

        eligible_not_registered_ids = eligible_student_ids - registered_student_ids
        return Student.objects.filter(id__in=eligible_not_registered_ids)


class BulkUpdateProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application_ids = request.data.get("application_ids", [])
        stage = request.data.get("stage")
        stage_status = request.data.get("status")
        final_result = request.data.get("final_result")
        joined = request.data.get("joined")
        if not isinstance(application_ids, list) or not application_ids:
            return Response(
                {"error": "application_ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                applications = StudentPlacementAppliedCompany.objects.filter(
                    id__in=application_ids
                ).select_related("student", "company", "job_offer", "application")

                if not applications:
                    return Response(
                        {"error": "No valid applications found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                progress_records_to_update = []
                offers_to_create = []

                update_data = {}
                if stage and stage_status is not None:
                    if not hasattr(PlacementCompanyProgress, stage):
                        raise ValueError(f"Invalid progress stage: {stage}")
                    update_data[stage] = stage_status

                if final_result:
                    update_data["final_result"] = final_result
                if not update_data and not joined:
                    print(joined)
                    return Response(
                        {
                            "error": "No update data provided (stage/status or final_result)."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                for app in applications:
                    progress = app.application
                    for field, value in update_data.items():
                        setattr(progress, field, value)
                    progress_records_to_update.append(progress)
                    if final_result == "Selected":
                        offer_type = (
                            "AEDP_PLI" if app.company.is_aedp_or_pli else "STANDARD"
                        )
                        offers_to_create.append(
                            StudentOffer(
                                student=app.student,
                                company=app.company,
                                job_offer=app.job_offer,
                                salary=app.job_offer.salary,
                                role=app.job_offer.role,
                                offer_type=offer_type,
                                status="offered",
                            )
                        )
                    if joined:
                        StudentOffer.objects.update(
                            student=app.student,
                            company=app.company,
                            status="joined",
                        )
                        app.student.joined_company = True
                        app.student.save()
                if progress_records_to_update and update_data:
                    PlacementCompanyProgress.objects.bulk_update(
                        progress_records_to_update, fields=update_data.keys()
                    )

                if offers_to_create:
                    StudentOffer.objects.bulk_create(offers_to_create)

            return Response(
                {
                    "status": "success",
                    "updated_count": len(progress_records_to_update),
                    "offers_created": len(offers_to_create),
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as e:
            print("ValueError:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TriggerExcelExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id, *args, **kwargs):
        task = generate_excel_export_task.delay(company_id)

        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class TriggerResumeExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id, *args, **kwargs):
        task = generate_resume_zip_task.delay(company_id)

        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class GetTaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        result = AsyncResult(task_id)

        response_data = {"task_id": task_id, "status": result.state}
        if result.state == "SUCCESS":
            response_data["url"] = result.result.get("file_url")
        elif result.state == "FAILURE":
            response_data["error"] = str(result.info)
        return Response(response_data, status=status.HTTP_200_OK)


class StudentDetailUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    lookup_field = "uid"


class UpdateStudentCategoryView(APIView):
    def post(self, request):
        data = request.data

        selected_batch = data.get("batch")
        target_category = data.get("category")

        try:
            th_cgpa = float(data.get("cgpa", 0))
            th_acad_att = float(data.get("academic_attendance", 0))
            th_train_att = float(data.get("training_attendance", 0))
            th_train_perf = float(data.get("training_performance", 0))
        except ValueError:
            return Response(
                {"error": "Invalid threshold values"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidates = Student.objects.filter(
            batch=selected_batch, cgpa__gte=th_cgpa, attendance__gte=th_acad_att
        )

        valid_student_ids = []

        for student in candidates:
            att_records = AttendanceData.objects.filter(uid=student.uid)
            total_sessions = att_records.count()

            avg_training_att = 0.0
            if total_sessions > 0:
                present_count = att_records.filter(present__iexact="Present").count()
                avg_training_att = (present_count / total_sessions) * 100
            perf_stats = TrainingPerformanceCategory.objects.filter(
                performance__student=student
            ).aggregate(avg_marks=Avg("marks"))

            avg_training_perf = perf_stats["avg_marks"] or 0.0

            if avg_training_att >= th_train_att and avg_training_perf >= th_train_perf:
                valid_student_ids.append(student.id)
        updated_count = Student.objects.filter(id__in=valid_student_ids).update(
            current_category=target_category
        )

        return Response(
            {
                "message": "Category updated successfully",
                "students_updated": updated_count,
            },
            status=status.HTTP_200_OK,
        )
