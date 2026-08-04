from django.http import JsonResponse, HttpResponse
import json
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    parser_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework import status
from .models import (
    InternshipRegistration,
    Offers,
    InternshipNotice,
    InternshipAcceptance,
)
from .serializers import (
    InternshipRegistrationSerializer,
    OffersSerializer,
    InternshipNoticeSerializer,
    InternshipAcceptanceSerializer,
    InternshipApplicationSerializer,
)
from rest_framework.permissions import IsAuthenticated
from .models import InternshipApplication
from uuid import uuid4
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from student.models import Student
from base.models import User
from datetime import datetime
import pandas as pd
import io


@api_view(["POST"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def create_company_with_offers(request):
    user = User.objects.get(email=request.user.email)
    if not user or user.role not in ["internship_officer", "staff"]:
        return JsonResponse(
            {"error": "Failed to find user"}, status=status.HTTP_404_NOT_FOUND
        )
    try:
        data = request.data
        company_data = data.get("company")
        company_serializer = InternshipRegistrationSerializer(data=company_data)
        if company_serializer.is_valid():
            company = company_serializer.save()
        else:
            return JsonResponse(
                company_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        # Create Offers
        offers_data = data.get("offers", [])
        for offer_data in offers_data:
            offer_data["company"] = company
            try:
                Offers.objects.create(**offer_data)
            except Exception as e:
                print(e)
        return JsonResponse(
            {
                "message": "Company and related offers created successfully!",
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        print(e)
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_company_with_offers(request, pk=None):
    try:
        if pk:
            # Retrieve a specific company and its offers
            company = InternshipRegistration.objects.get(id=pk)
            company_serializer = InternshipRegistrationSerializer(company)
            offers = Offers.objects.filter(company=company)
            offers_serializer = OffersSerializer(offers, many=True)

            return JsonResponse(
                {
                    "company": company_serializer.data,
                    "offers": offers_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        else:
            # Retrieve all companies with their offers
            companies = InternshipRegistration.objects.all()
            response_data = []
            for company in companies:
                company_serializer = InternshipRegistrationSerializer(company)
                offers = Offers.objects.filter(company=company)
                offers_serializer = OffersSerializer(offers, many=True)

                response_data.append(
                    {
                        "company": company_serializer.data,
                        "offers": offers_serializer.data,
                    }
                )

            return JsonResponse(response_data, safe=False, status=status.HTTP_200_OK)
    except InternshipRegistration.DoesNotExist:
        return JsonResponse(
            {"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_all_companies(request):
    user = User.objects.get(email=request.user.email)
    if not user or user.role not in ["internship_officer", "staff"]:
        return JsonResponse(
            {"error": "Failed to find user"}, status=status.HTTP_404_NOT_FOUND
        )
    try:
        companies = InternshipRegistration.objects.all()
        company_data = []
        for company in companies:
            company_serializer = InternshipRegistrationSerializer(company)
            offers = Offers.objects.filter(company=company)
            offers_serializer = OffersSerializer(offers, many=True)
            company_data.append(
                {"company": company_serializer.data, "offers": offers_serializer.data}
            )
        return JsonResponse(company_data, safe=False, status=status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def job_application(request, pk):
    try:
        user = User.objects.get(email=request.user.email)
        student = Student.objects.get(user=user)
        company = InternshipRegistration.objects.get(pk=pk)
        InternshipApplication.objects.create(
            company=company, id=uuid4(), student=student
        )
        return JsonResponse(
            {"success": "Job application submitted successfully"},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_all_applied_students(request, pk):
    user = User.objects.get(email=request.user.email)
    if not user or user.role not in ["internship_officer", "staff"]:
        return JsonResponse(
            {"error": "Failed to find user"}, status=status.HTTP_404_NOT_FOUND
        )
    try:
        company = InternshipApplication(pk=pk)
        students = InternshipApplicationSerializer(company)
        pass
        return JsonResponse({"students": students.data})
    except Exception as e:
        print(e)
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_job_acceptance(request):
    try:
        user = User.objects.get(email=request.user.email)
        if not user:
            return JsonResponse(
                {"error": "Failed to find user"}, status=status.HTTP_404_NOT_FOUND
            )
        student = Student.objects.get(user=user)
        data = request.data
        if not student:
            return JsonResponse(
                {"error": "Failed to find student"}, status=status.HTTP_404_NOT_FOUND
            )
        start_date_str = data.get("startDate")
        end_date_str = data.get("endDate")
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        completion_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        if data.get("selectOption") == "in_house":
            print("In house")
            InternshipAcceptance.objects.create(
                student=student,
                year=data.get("year"),
                domain_name=data.get("domain"),
                start_date=start_date,
                completion_date=completion_date,
                company_name="Thakur College of Enginerring and Technology",
            )
        else:
            if not request.FILES.get("offerLetter"):
                return JsonResponse(
                    {"error": "Offer letter is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            InternshipAcceptance.objects.create(
                student=student,
                year=data.get("year"),
                company_name=data.get("companyName"),
                offer_letter=request.FILES.get("offerLetter"),
                offer_type=data.get("selectOption"),
                salary=float(data.get("stipend")),
                is_verified=False,
                domain_name=data.get("domain"),
                start_date=start_date,
                completion_date=completion_date,
            )
        return JsonResponse({"success": "Job application created"})
    except Exception as e:
        print(e)
        return JsonResponse(
            {"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_job_acceptance_by_id(request, pk):
    try:
        job_acceptance = InternshipAcceptance.objects.get(id=pk)
    except InternshipAcceptance.DoesNotExist:
        return JsonResponse(
            {"error": "Job acceptance not found."}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = InternshipAcceptanceSerializer(job_acceptance)
    return JsonResponse(serializer.data)


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_jobs_by_company_name(request, company_name):
    jobs = InternshipAcceptance.objects.filter(company_name=company_name)
    if not jobs.exists():
        return JsonResponse(
            {"error": "No jobs found for this company name."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = InternshipAcceptanceSerializer(jobs, many=True)
    return JsonResponse(serializer.data)


@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_unverified_internships(request):
    acceptances = InternshipAcceptance.objects.filter(is_verified=False).select_related('student', 'student__user')
    data = []
    for acc in acceptances:
        data.append({
            "id": str(acc.id),
            "batch": acc.student.batch if acc.student else "",
            "company_name": acc.company_name or "In House",
            "offer_letter": acc.offer_letter.url if acc.offer_letter else "",
            "verified": acc.is_verified,
            "uid": acc.student.uid if acc.student else "",
            "student_name": acc.student.user.full_name if (acc.student and acc.student.user) else "",
            "domain_name": acc.domain_name,
        })
    return JsonResponse(data, safe=False)

@api_view(["POST"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def verify_selected_internships(request):
    job_ids = request.data.get("jobIds", [])
    InternshipAcceptance.objects.filter(id__in=job_ids).update(is_verified=True)
    return JsonResponse({"success": "Jobs verified successfully"})

@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_verified_internships(request):
    acceptances = InternshipAcceptance.objects.filter(is_verified=True).select_related('student', 'student__user')
    data = []
    for acc in acceptances:
        data.append({
            "id": str(acc.id),
            "student_name": acc.student.user.full_name if (acc.student and acc.student.user) else "",
            "uid": acc.student.uid if acc.student else "",
            "company_name": acc.company_name or "In House",
            "domain_name": acc.domain_name,
            "start_date": acc.start_date.isoformat() if acc.start_date else "",
            "completion_date": acc.completion_date.isoformat() if acc.completion_date else "",
            "total_hours": acc.total_hours,
            "type": acc.type,
            "salary": acc.salary,
            "is_verified": acc.is_verified,
            "year": acc.year,
            "branch": acc.student.department if acc.student else "",
        })
    return JsonResponse(data, safe=False)

@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def download_verified_internships(request):
    try:
        acceptances = InternshipAcceptance.objects.filter(is_verified=True).select_related('student', 'student__user')
        
        data = []
        for index, acc in enumerate(acceptances):
            data.append({
                "Sr. No.": index + 1,
                "Department": acc.student.department if acc.student else "",
                "UID": acc.student.uid if acc.student else "",
                "Student Name": acc.student.user.full_name if (acc.student and acc.student.user) else "",
                "Start Date": acc.start_date.strftime("%Y-%m-%d") if acc.start_date else "",
                "Completion Date": acc.completion_date.strftime("%Y-%m-%d") if acc.completion_date else "",
                "Company Name": acc.company_name or "In House",
                "Stipend": acc.salary,
            })
        
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')
        df.to_excel(writer, sheet_name='Verified Internships', index=False)
        
        statistics_str = request.GET.get('statistics')
        if statistics_str:
            try:
                statistics = json.loads(statistics_str)
                stat_data = statistics.get("data", [])
                if len(stat_data) > 0:
                    stat_df = pd.DataFrame(stat_data[1:], columns=stat_data[0])
                    stat_df.to_excel(writer, sheet_name='Stipend Statistics', index=False)
            except Exception as e:
                print("Error parsing statistics:", e)
                
        writer.close()
        output.seek(0)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=internship_report.xlsx'
        return response
    except Exception as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)