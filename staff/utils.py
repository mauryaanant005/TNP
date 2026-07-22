from student.models import Student

def is_student_eligible(student, company):
    if (
        float(student.tenth_grade or 0) < float(company.min_tenth_marks)
        or float(student.higher_secondary_grade or 0) < float(company.min_higher_secondary_marks)
        or float(student.cgpa or 0) < float(company.min_cgpa)
    ):
        return False
    if student.is_blacklisted:
        return False
    if student.is_kt and not company.accepted_kt:
        return False
    if company.is_aedp_or_pli:
        offer_type = "AEDP_PLI"
    elif company.is_aedp_or_ojt:
        offer_type = "AEDP_OJT"
    else:
        offer_type = "PLACEMENT"
    if offer_type == "AEDP_PLI" and student.consent != "placement+aedp/pli":
        return False
    if offer_type == "PLACEMENT" and student.consent not in ["placement", "placement+aedp/pli"]:
        return False
    if student.student_offers.filter(status="joined", offer_type="AEDP_PLI").exists():
        return False
    job_offers = company.job_offers.all()
    if not job_offers.exists():
        return False
    category = student.current_category
    accepted_offers = student.student_offers.filter(status__in=["accepted", "joined"])

    def get_tier(s):
        if s < 5:
            return "low"
        elif s < 10:
            return "mid"
        return "high"
    for job_offer in job_offers:
        try:
            salary = float(job_offer.salary)
        except (ValueError, TypeError):
            continue
        if category == "Category 3":
            if salary > 5:
                continue
            if accepted_offers.exists():  #
                continue
            return True

        elif category == "Category 2":
            if salary > 10:
                continue
            has_above_5 = accepted_offers.filter(salary__gte=5).exists()

            if has_above_5 and salary < 5:
                continue
            if accepted_offers.filter(salary__gte=10).exists():
                continue
            return True

        elif category == "Category 1":
            current_tier = get_tier(salary)
            if accepted_offers.filter(salary__gte=10).exists():
                continue

            existing_tiers = {get_tier(float(o.salary)) for o in accepted_offers if o.salary}
            if current_tier in existing_tiers:
                continue
            if "mid" in existing_tiers and salary < 5:
                continue
            if "high" in existing_tiers and salary < 10:
                continue
            return True
    return False


def get_eligible_students(company):

    students = Student.objects.filter(
        batch=company.batch,
        academic_year="BE",
        is_blacklisted=False,
    )
    if company.selected_departments:
        students = students.filter(department__in=company.selected_departments)
    if not company.accepted_kt:
        students = students.filter(is_kt=False)

    eligible_students = []
    students = students.select_related("user").prefetch_related("student_offers")
    for student in students:
        if is_student_eligible(student, company):
            eligible_students.append(student.id)

    return eligible_students
