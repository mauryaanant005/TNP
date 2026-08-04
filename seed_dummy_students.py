import os
import django
import uuid
import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 't_and_p_automation.settings')
django.setup()

from base.models import User
from student.models import (
    Student, AcademicPerformanceSemester, AcademicAttendanceSemester,
    Resume, Resume_Contact, Resume_Education, Resume_Project, Resume_Skill,
    Resume_WorkExperience, Resume_ActivitiesAndAchievement, StudentOffer,
    StudentPlacementAppliedCompany, PlacementCompanyProgress
)
from staff.models import CompanyRegistration, JobOffer, Notice
from program_coordinator_api.models import AttendanceData, TrainingPerformance, TrainingPerformanceCategory
from internship_api.models import InternshipAcceptance
from notifications.models import Notification
import notifications.signals

# Mock the celery task to avoid Redis/Email connection issues during seeding
notifications.signals.send_notification_email.delay = lambda x: None

def seed_data():
    print("Seeding dummy students for test...")
    
    # Create or update System Admin User to act as the notification sender
    admin_user, _ = User.objects.get_or_create(
        email='admin@tcetmumbai.in',
        defaults={'full_name': 'System Admin', 'role': 'system_admin', 'is_staff': True}
    )

    # ==========================
    # 1. User & Student Creation
    # ==========================
    
    student1_uid = "UID-IT-2028-01"
    student1_email = "it.student2028@tcetmumbai.in"
    student2_uid = "UID-COMP-2028-02"
    student2_email = "comp.student2028@tcetmumbai.in"

    user1, _ = User.objects.get_or_create(email=student1_email, defaults={
        'full_name': 'Aarav Sharma (IT Placed)',
        'role': 'student'
    })
    user1.set_password('tcet@1234')
    user1.save()

    user2, _ = User.objects.get_or_create(email=student2_email, defaults={
        'full_name': 'Priya Patel (COMP Active)',
        'role': 'student'
    })
    user2.set_password('tcet@1234')
    user2.save()

    s1, _ = Student.objects.update_or_create(
        uid=student1_uid,
        defaults={
            'user': user1,
            'department': 'IT',
            'academic_year': 'BE',
            'current_category': 'Category 1',
            'division': 'A',
            'gender': 'MALE',
            'dob': '2005-04-15',
            'contact': '9876543210',
            'personal_email': 'aarav.sharma@gmail.com',
            'tenth_grade': 92.5,
            'higher_secondary_grade': 88.0,
            'card': 'Green',
            'consent': 'placement',
            'batch': '2028',
            'cgpa': 9.2,
            'attendance': 85.5,
            'is_kt': False,
            'is_blacklisted': False,
            'joined_company': True
        }
    )

    s2, _ = Student.objects.update_or_create(
        uid=student2_uid,
        defaults={
            'user': user2,
            'department': 'COMP',
            'academic_year': 'BE',
            'current_category': 'Category 2',
            'division': 'B',
            'gender': 'FEMALE',
            'dob': '2005-08-22',
            'contact': '9123456780',
            'personal_email': 'priya.patel@gmail.com',
            'tenth_grade': 89.0,
            'higher_secondary_grade': 85.5,
            'card': 'Yellow',
            'consent': 'placement',
            'batch': '2028',
            'cgpa': 8.1,
            'attendance': 78.0,
            'is_kt': False,
            'is_blacklisted': False,
            'joined_company': False
        }
    )

    # ==========================
    # 2. Academic Performance & Attendance
    # ==========================
    semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7"]
    for i, sem in enumerate(semesters):
        # Student 1
        AcademicPerformanceSemester.objects.update_or_create(student=s1, semester=sem, defaults={'performance': 9.0 + (i*0.05)})
        AcademicAttendanceSemester.objects.update_or_create(student=s1, semester=sem, defaults={'attendance': 80 + (i)})
        # Student 2
        AcademicPerformanceSemester.objects.update_or_create(student=s2, semester=sem, defaults={'performance': 8.0 + (i*0.02)})
        AcademicAttendanceSemester.objects.update_or_create(student=s2, semester=sem, defaults={'attendance': 75 + (i)})

    # ==========================
    # 3. Training Attendance
    # ==========================
    programs = ["ACT Technical", "ACT Aptitude", "SDP", "Coding Contest"]
    now = timezone.now()
    for prog in programs:
        # Student 1
        AttendanceData.objects.update_or_create(
            uid=s1.uid, program_name=prog, session="Session 1",
            defaults={'batch': '2028', 'late': 'No', 'name': user1.full_name, 'present': 'Present', 'timestamp': now, 'year': 'BE', 'semester': 'Semester 7'}
        )
        # Student 2
        AttendanceData.objects.update_or_create(
            uid=s2.uid, program_name=prog, session="Session 1",
            defaults={'batch': '2028', 'late': 'No', 'name': user2.full_name, 'present': 'Present', 'timestamp': now, 'year': 'BE', 'semester': 'Semester 7'}
        )

    # ==========================
    # 4. Training Performance
    # ==========================
    for prog in programs:
        # Student 1
        tp1, _ = TrainingPerformance.objects.update_or_create(student=s1, training_type=prog, defaults={'semester': 'Semester 7', 'date': datetime.date.today(), 'uploaded_by': admin_user})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp1, category_name="Aptitude", defaults={'marks': 85.0})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp1, category_name="Technical", defaults={'marks': 92.0})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp1, category_name="Communication", defaults={'marks': 88.0})

        # Student 2
        tp2, _ = TrainingPerformance.objects.update_or_create(student=s2, training_type=prog, defaults={'semester': 'Semester 7', 'date': datetime.date.today(), 'uploaded_by': admin_user})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp2, category_name="Aptitude", defaults={'marks': 75.0})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp2, category_name="Technical", defaults={'marks': 80.0})
        TrainingPerformanceCategory.objects.update_or_create(performance=tp2, category_name="Communication", defaults={'marks': 82.0})

    # ==========================
    # 5. Companies & Notices
    # ==========================
    notice_m, _ = Notice.objects.get_or_create(subject="Morgan Stanley Recruitment", defaults={'date': datetime.date.today(), 'deadline': datetime.date.today()})
    comp_ms, _ = CompanyRegistration.objects.get_or_create(name="Morgan Stanley", batch="2028", defaults={'min_cgpa': '8.0', 'domain': 'IT', 'departments': 'All', 'notice': notice_m})
    
    notice_tcs, _ = Notice.objects.get_or_create(subject="TCS Digital", defaults={'date': datetime.date.today(), 'deadline': datetime.date.today()})
    comp_tcs, _ = CompanyRegistration.objects.get_or_create(name="TCS Digital", batch="2028", defaults={'min_cgpa': '7.0', 'domain': 'IT', 'departments': 'All', 'notice': notice_tcs})

    notice_amz, _ = Notice.objects.get_or_create(subject="Amazon SDE", defaults={'date': datetime.date.today(), 'deadline': datetime.date.today()})
    comp_amz, _ = CompanyRegistration.objects.get_or_create(name="Amazon", batch="2028", defaults={'min_cgpa': '8.5', 'domain': 'IT', 'departments': 'All', 'notice': notice_amz})

    job_ms, _ = JobOffer.objects.get_or_create(form=comp_ms, role="Software Engineer", defaults={'salary': "12.0", 'skills': 'Backend Dev'})
    job_tcs, _ = JobOffer.objects.get_or_create(form=comp_tcs, role="Systems Engineer", defaults={'salary': "7.0", 'skills': 'Full Stack Dev'})
    job_amz, _ = JobOffer.objects.get_or_create(form=comp_amz, role="SDE 1", defaults={'salary': "25.0", 'skills': 'SDE'})

    # ==========================
    # 6. Placement Cards (Applications & Offers)
    # ==========================
    
    # Student 1: Placed at Morgan Stanley (12 LPA)
    app1, _ = StudentPlacementAppliedCompany.objects.update_or_create(student=s1, company=comp_ms, defaults={'job_offer': job_ms, 'interested': True})
    PlacementCompanyProgress.objects.update_or_create(application=app1, defaults={'registered': True, 'aptitude_test': True, 'coding_test': True, 'technical_interview': True, 'hr_interview': True, 'final_result': 'Selected'})
    
    app2, _ = StudentPlacementAppliedCompany.objects.update_or_create(student=s1, company=comp_amz, defaults={'job_offer': job_amz, 'interested': True})
    PlacementCompanyProgress.objects.update_or_create(application=app2, defaults={'registered': True, 'aptitude_test': True, 'coding_test': True, 'technical_interview': False, 'hr_interview': False, 'final_result': 'Rejected'})

    StudentOffer.objects.update_or_create(student=s1, company=comp_ms, role="Software Engineer", defaults={'job_offer': job_ms, 'offer_type': 'PLACEMENT', 'status': 'accepted', 'salary': 12.0})

    # Student 2: Active, shortlisted for TCS but no offer
    app3, _ = StudentPlacementAppliedCompany.objects.update_or_create(student=s2, company=comp_tcs, defaults={'job_offer': job_tcs, 'interested': True})
    PlacementCompanyProgress.objects.update_or_create(application=app3, defaults={'registered': True, 'aptitude_test': True, 'coding_test': True, 'technical_interview': True, 'hr_interview': False, 'final_result': 'Pending HR'})

    # ==========================
    # 7. Internship Summary
    # ==========================
    InternshipAcceptance.objects.update_or_create(
        student=s1, company_name="Google Summer of Code", type="Full-time",
        defaults={
            'salary': 50000.0, 'is_verified': True, 'domain_name': 'Open Source',
            'start_date': datetime.date(2027, 5, 1), 'completion_date': datetime.date(2027, 7, 30),
            'total_hours': 300, 'offer_type': 'out_house'
        }
    )
    InternshipAcceptance.objects.update_or_create(
        student=s2, company_name="TCET In-House Internship", type="Part-time",
        defaults={
            'salary': 0.0, 'is_verified': True, 'domain_name': 'Web Development',
            'start_date': datetime.date(2026, 6, 1), 'completion_date': datetime.date(2026, 7, 15),
            'total_hours': 100, 'offer_type': 'in_house'
        }
    )

    # ==========================
    # 8. Resume
    # ==========================
    r1, _ = Resume.objects.update_or_create(student=s1, defaults={'name': user1.full_name, 'email': user1.email, 'phone_number': '9876543210'})
    Resume_Contact.objects.filter(resume=r1).delete()
    Resume_Contact.objects.create(resume=r1, url="https://github.com/aarav2028")
    Resume_Contact.objects.create(resume=r1, url="https://linkedin.com/in/aarav2028")
    Resume_Skill.objects.filter(resume=r1).delete()
    Resume_Skill.objects.create(resume=r1, skill="Python")
    Resume_Skill.objects.create(resume=r1, skill="Django")
    Resume_Skill.objects.create(resume=r1, skill="React")
    Resume_Education.objects.filter(resume=r1).delete()
    Resume_Education.objects.create(resume=r1, institution="TCET", degree="BE IT", start_date="2024", end_date="2028", percentage="92.5%")
    Resume_Project.objects.filter(resume=r1).delete()
    Resume_Project.objects.create(resume=r1, title="AI Chatbot", description="Built an AI chatbot using NLP")
    Resume_WorkExperience.objects.filter(resume=r1).delete()
    Resume_WorkExperience.objects.create(resume=r1, company="GSoC", position="Contributor", start_date="May 2027", end_date="Aug 2027", description="Contributed to open source")
    Resume_ActivitiesAndAchievement.objects.filter(resume=r1).delete()
    Resume_ActivitiesAndAchievement.objects.create(resume=r1, title="Hackathon Winner", description="Won Smart India Hackathon 2027")

    r2, _ = Resume.objects.update_or_create(student=s2, defaults={'name': user2.full_name, 'email': user2.email, 'phone_number': '9123456780'})
    Resume_Contact.objects.filter(resume=r2).delete()
    Resume_Contact.objects.create(resume=r2, url="https://github.com/priya2028")
    Resume_Contact.objects.create(resume=r2, url="https://linkedin.com/in/priya2028")
    Resume_Skill.objects.filter(resume=r2).delete()
    Resume_Skill.objects.create(resume=r2, skill="Java")
    Resume_Skill.objects.create(resume=r2, skill="Spring Boot")
    Resume_Education.objects.filter(resume=r2).delete()
    Resume_Education.objects.create(resume=r2, institution="TCET", degree="BE COMP", start_date="2024", end_date="2028", percentage="89.0%")
    Resume_Project.objects.filter(resume=r2).delete()
    Resume_Project.objects.create(resume=r2, title="E-Commerce App", description="Built a full stack app")
    Resume_WorkExperience.objects.filter(resume=r2).delete()
    Resume_WorkExperience.objects.create(resume=r2, company="TCET", position="Intern", start_date="Jun 2026", end_date="Jul 2026", description="In-house internship")
    
    # ==========================
    # 9. Notifications
    # ==========================
    notifs = [
        ("Placement Drive for Morgan Stanley", "The placement drive starts next week.", "placement", "all_students"),
        ("TCS Technical Interview Schedule", "Check your emails for the schedule.", "placement", "all_students"),
        ("Aptitude Training Session", "Mandatory aptitude training session tomorrow.", "training", "all_students"),
        ("Resume Submission Deadline", "Please submit your resumes by EOD.", "general", "all_students"),
        ("Document Verification", "Bring original documents to T&P cell.", "general", "department_students"),
        ("Internship Certificates Available", "Collect your internship completion certificates.", "internship", "all_students"),
        ("Coding Contest Upcoming", "Join the annual coding contest.", "general", "all_students"),
    ]
    
    for title, msg, cat, aud in notifs:
        n, _ = Notification.objects.get_or_create(title=title, defaults={'message': msg, 'creator': admin_user, 'category': cat, 'target_audience': aud})
        n.recipients.add(user1)
        n.recipients.add(user2)
    
    print("Dummy students generated successfully!")
    print(f"Student 1: {user1.email} / tcet@1234 (Placed)")
    print(f"Student 2: {user2.email} / tcet@1234 (Active)")

if __name__ == '__main__':
    seed_data()
