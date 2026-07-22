import numpy as np


def categorize(
    academic_attendance,
    academic_performance,
    training_attendance,
    training_performance,
    batch,
):
    from placement_officer.models import CategoryRule

    if any(
        x is None or np.isnan(x)
        for x in [
            academic_attendance,
            academic_performance,
            training_attendance,
            training_performance,
        ]
    ):
        return "Category_NA"

    # Get all rules for the batch, ordered by category
    rules = CategoryRule.objects.filter(batch=batch).order_by("category")

    # Check each category rule in order
    for rule in rules:
        if (
            academic_attendance >= rule.minimum_academic_attendance
            and academic_performance >= rule.minimum_academic_performance
            and training_attendance >= rule.minimum_training_attendance
            and training_performance >= rule.minimum_training_performance
        ):
            return rule.category

    # If no rules match, return the lowest category
    return "Category_4"

def is_student_eligible(student, company,offer):
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
    if student.joined_company:
        return False
    job_offers = [offer]
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

