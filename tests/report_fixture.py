"""A small, fully deterministic dataset for the report characterisation tests.

Every number below is chosen so the expected output can be worked out by hand
rather than copied from a run. That matters: a characterisation test whose
expectations were pasted from the code's own output only proves the code still
does what it did — it cannot tell you whether what it did was right. Where the
hand-computed answer and the code disagree, the disagreement is a finding.

Shape:

    batch 2025, department IT   — 3 students
    batch 2025, department CMPN — 2 students
    batch 2024, department IT   — 1 student   (must not leak into 2025 reports)

Offers, all in the batch 2025 cohort:

    it_a    Acme     8.0  accepted   \\  IT: 2 placed of 3
    it_b    Beta    12.0  joined     /
    it_c    —                        (unplaced)
    cmpn_a  Acme     4.0  offered      CMPN: 1 "placed" of 2
    cmpn_b  —                        (unplaced)

Note `PlacementDashboardAPIView` counts a student as placed if *any*
StudentOffer exists, regardless of status — so `cmpn_a`'s "offered" row counts.
That is pinned, not endorsed; see the ⚠️ in the test module.
"""

from tests import factories

BATCH = "2025"
OTHER_BATCH = "2024"


def build():
    """Create the dataset and return a dict of its objects."""
    data = {}

    # --- students ---------------------------------------------------------
    data["it_a"] = factories.StudentFactory(
        uid="0001-ITC001-25", department="IT-A", division="A",
        academic_year="BE", batch=BATCH, cgpa=8.5, attendance=90.0,
        consent="placement", current_category="Category 1",
    )
    data["it_b"] = factories.StudentFactory(
        uid="0002-ITC002-25", department="IT-A", division="A",
        academic_year="BE", batch=BATCH, cgpa=9.0, attendance=95.0,
        consent="placement", current_category="Category 1",
    )
    data["it_c"] = factories.StudentFactory(
        uid="0003-ITC003-25", department="IT-B", division="B",
        academic_year="BE", batch=BATCH, cgpa=6.0, attendance=70.0,
        consent="Higher studies", current_category="Category 3", is_kt=True,
    )
    data["cmpn_a"] = factories.StudentFactory(
        uid="0004-CMPN004-25", department="CMPN-A", division="A",
        academic_year="BE", batch=BATCH, cgpa=7.5, attendance=85.0,
        consent="placement", current_category="Category 2",
    )
    data["cmpn_b"] = factories.StudentFactory(
        uid="0005-CMPN005-25", department="CMPN-A", division="A",
        academic_year="BE", batch=BATCH, cgpa=7.0, attendance=80.0,
        consent="Entrepreneurship", current_category="Category 2",
    )
    # Different batch - every batch-scoped report must exclude this one.
    data["old"] = factories.StudentFactory(
        uid="0006-ITC006-24", department="IT-A", division="A",
        academic_year="BE", batch=OTHER_BATCH, cgpa=8.0, attendance=88.0,
        consent="placement", current_category="Category 1",
    )

    # --- companies and job offers ----------------------------------------
    data["acme"] = factories.CompanyRegistrationFactory(
        name="Acme", batch=BATCH, selected_departments=["IT-A", "CMPN-A"],
    )
    data["beta"] = factories.CompanyRegistrationFactory(
        name="Beta", batch=BATCH, selected_departments=["IT-A"],
    )
    data["acme_role"] = factories.JobOfferFactory(
        form=data["acme"], role="Engineer", salary="8",
    )
    data["beta_role"] = factories.JobOfferFactory(
        form=data["beta"], role="Analyst", salary="12",
    )

    # --- offers -----------------------------------------------------------
    data["offer_it_a"] = factories.StudentOfferFactory(
        student=data["it_a"], company=data["acme"], job_offer=data["acme_role"],
        salary=8.0, role="Engineer", status="accepted",
    )
    data["offer_it_b"] = factories.StudentOfferFactory(
        student=data["it_b"], company=data["beta"], job_offer=data["beta_role"],
        salary=12.0, role="Analyst", status="joined",
    )
    data["offer_cmpn_a"] = factories.StudentOfferFactory(
        student=data["cmpn_a"], company=data["acme"], job_offer=data["acme_role"],
        salary=4.0, role="Engineer", status="offered",
    )

    # --- applications and per-round progress ------------------------------
    # `BranchwiseReportAPIView` counts these per department per company. Set so
    # each column has a distinguishable value rather than all-or-nothing:
    #
    #   it_a    -> Acme: registered, aptitude, coding
    #   it_c    -> Acme: registered only          (applied but not placed)
    #   cmpn_a  -> Acme: registered, aptitude
    for key, company_key, cleared in [
        ("it_a", "acme", ["aptitude_test", "coding_test"]),
        ("it_c", "acme", []),
        ("cmpn_a", "acme", ["aptitude_test"]),
    ]:
        application = factories.StudentPlacementAppliedCompanyFactory(
            student=data[key], company=data[company_key], job_offer=data["acme_role"],
        )
        factories.PlacementCompanyProgressFactory(
            application=application,
            **{field: True for field in cleared},
        )

    return data
