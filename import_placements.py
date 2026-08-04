import os
import django
import pandas as pd
import datetime
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 't_and_p_automation.settings')
django.setup()

from base.models import User
from student.models import Student, StudentOffer
from staff.models import CompanyRegistration, Notice
from django.db import transaction

def clean_val(val):
    if pd.isna(val):
        return None
    return val

def process_file(filename, batch):
    print(f"Processing {filename} for batch {batch}")
    df = pd.read_excel(filename, header=None)
    
    header_idx = None
    for idx, row in df.iterrows():
        row_str = ' '.join([str(x) for x in row.values])
        if 'T&P(UID)' in row_str or 'UID' in row_str:
            header_idx = idx
            break
            
    if header_idx is None:
        print("Could not find header row!")
        return
        
    df = pd.read_excel(filename, header=header_idx)
    
    col_mapping = {
        'uid': ['T&P(UID)', 'T&P (UID)', 'UID', 'uid'],
        'employer_name': ['Employer  Name', 'Employer Name', 'Company Name', 'EmployerName'],
        'type_of_placement': ['Type of Placement', 'Placement Type', 'Type of Offer'],
        'salary': ['Salary offered', 'Salary Offered', 'Salary', 'CTC', 'LPA'],
    }
    
    def find_col(possible_names):
        for c in df.columns:
            c_str = str(c).strip().replace('\n', ' ')
            for n in possible_names:
                if n.lower() in c_str.lower():
                    return c
        return None
    
    uid_col = find_col(col_mapping['uid'])
    emp_col = find_col(col_mapping['employer_name'])
    type_col = find_col(col_mapping['type_of_placement'])
    salary_col = find_col(col_mapping['salary'])
    
    if not uid_col or not emp_col:
        print("Missing required columns!")
        return
        
    with transaction.atomic():
        count = 0
        for _, row in df.iterrows():
            uid = clean_val(row.get(uid_col))
            if not uid:
                continue
                
            employer_name = clean_val(row.get(emp_col))
            if not employer_name:
                continue
                
            placement_type = clean_val(row.get(type_col)) if type_col else None
            salary = clean_val(row.get(salary_col)) if salary_col else 0.0
            
            if salary is None:
                salary = 0.0
            else:
                try:
                    salary = float(str(salary).replace(',', '').split()[0])
                except Exception:
                    salary = 0.0
            
            student_name = clean_val(row.get('Student Name', 'Unknown')) if 'Student Name' in df.columns else 'Unknown'
            email = f"{str(uid).strip().lower()}@student.tcet.ac.in"
            
            # Create user first to avoid IntegrityError
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': student_name if student_name else 'Unknown',
                    'role': 'student',
                }
            )
            
            student, _ = Student.objects.get_or_create(
                uid=str(uid).strip(),
                defaults={
                    'user': user,
                    'batch': batch,
                }
            )
            if student.batch != batch:
                student.batch = batch
                student.save()
            
            # 2. Get or create company
            try:
                company = CompanyRegistration.objects.get(name=str(employer_name).strip(), batch=batch)
            except CompanyRegistration.DoesNotExist:
                new_notice = Notice.objects.create(
                    subject=f"{employer_name} for {batch}",
                    date=datetime.date.today(),
                    intro='Imported',
                    about='Imported',
                    company_registration_link='http://example.com',
                    location='Mumbai',
                    deadline=datetime.date.today()
                )
                company = CompanyRegistration.objects.create(
                    name=str(employer_name).strip(),
                    batch=batch,
                    min_tenth_marks='0',
                    min_higher_secondary_marks='0',
                    min_cgpa='0',
                    domain='IT',
                    departments='All',
                    notice=new_notice
                )
            
            p_type = 'PLACEMENT'
            if placement_type:
                p_type_str = str(placement_type).upper()
                if 'AEDP' in p_type_str and 'PLI' in p_type_str:
                    p_type = 'AEDP_PLI'
                elif 'AEDP' in p_type_str:
                    p_type = 'AEDP_OJT'
                
            StudentOffer.objects.get_or_create(
                student=student,
                company=company,
                role='Software Engineer', 
                defaults={
                    'offer_type': p_type,
                    'status': 'accepted',
                    'salary': salary,
                }
            )
            count += 1
            
        print(f"Added {count} placement records for {batch}")

if __name__ == '__main__':
    process_file('Students Placement Register Batch-2026 30052026.xls', '2028')
    process_file('Students Placement Register Batch-2027 07072026.xls', '2027')
