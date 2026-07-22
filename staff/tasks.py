import io
import zipfile
import openpyxl
from celery import shared_task
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils.text import slugify
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
# from weasyprint import HTML
from .models import CompanyRegistration
from student.models import StudentPlacementAppliedCompany,Resume

@shared_task
def generate_excel_export_task(company_id):
    try:
        company = CompanyRegistration.objects.get(id=company_id)
    except CompanyRegistration.DoesNotExist:
        print(f"Company with id={company_id} not found.")
        return {"error": "Company not found."}

    print("Generating Excel for Company:", company)
    applications = StudentPlacementAppliedCompany.objects.filter(
        company=company, interested=True
    ).select_related('student', 'student__user') #
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Registered Students"
    columns = [
        'UID', 'Full Name', 'Personal Email', 'Contact',
        'Department', '10th Grade %', '12th Grade %', 'CGPA',
        'Active KT', 'DSE Student','role'
    ]
    ws.append(columns)
    if not applications.exists():
        print(f"No interested students found for {company.name}.")
    else:
        for app in applications:
            student = app.student
            row = [
                student.uid,
                student.user.full_name,
                student.personal_email,
                student.contact,
                student.department or 'N/A',
                student.tenth_grade,
                student.higher_secondary_grade,
                student.cgpa,
                "Yes" if student.is_kt else "No",
                "Yes" if student.is_dse_student else "No",
                app.job_offer.role
            ]
            ws.append(row)

    buffer = io.BytesIO()
    wb.save(buffer)
    file_content = buffer.getvalue()
    filename = f"exports/excel/{slugify(company.name)}_students.xlsx"

    if default_storage.exists(filename):
        default_storage.delete(filename)

    actual_filename = default_storage.save(filename, ContentFile(file_content))

    print(f"File saved successfully: {actual_filename}")
    return {"file_url": default_storage.url(actual_filename)}


@shared_task
def generate_resume_zip_task(company_id):
    company = get_object_or_404(CompanyRegistration, id=company_id)

    applications = StudentPlacementAppliedCompany.objects.filter(
        company=company, interested=True
    )

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for app in applications:
            student = app.student
            if not hasattr(student, 'resume'):
                continue
            try:
                resume = Resume.objects.get(student=student)
            except Resume.DoesNotExist:
                continue
            context = {
                'student': student, 'resume': resume,
                'contacts': resume.contact.all(), 'skills': resume.skill.all(),
                'work_exps': resume.work.all(), 'projects': resume.project.all(),
                'education': resume.education.all(),
                'achievements': resume.activities_and_achievements.all(),
            }
            html_string = render_to_string('resume_template.html', context)
            pdf_file = HTML(string=html_string).write_pdf()
            filename = f"{student.uid}_{student.user.full_name}.pdf"
            # zf.writestr(filename, pdf_file)

    zip_buffer.seek(0)
    filename = f"exports/resumes/{slugify(company.name)}_resumes.zip"
    file_path = default_storage.save(filename, ContentFile(zip_buffer.read()))
    return {"file_url": default_storage.url(file_path)}