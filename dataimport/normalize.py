"""Value coercion for spreadsheet imports.

Every function here takes whatever pandas handed us — ``NaN``, a float that
should have been a string, a datetime that should have been text, a header
fragment that leaked into a data column — and returns either a clean value or
``None``. Nothing here touches the database.

The rules are derived from the actual contents of the four source files, not
from what their headers claim. Where the files disagree with the database's
established vocabulary (``IOT`` vs ``IoT``), the database wins: these values
are matched with exact ``filter(department=...)`` lookups all over the API, so
a casing variant is a silently empty report.
"""

from __future__ import annotations

import datetime as dt
import math
import re

# ---------------------------------------------------------------------------
# UID
# ---------------------------------------------------------------------------

# Real T&P UIDs look like ``22-AI&DSB44-26`` / ``23-COMPA06-27`` / ``24-IT-A01-28``:
#   <2-digit admission year>-<branch+division+roll>-<2-digit passing year>
#
# This gate is the ONLY thing separating data from noise in the placement
# registers. Below and to the right of the data block those files carry
# signature lines, per-branch pivot tables and salary summaries, all of which
# pandas reads as ordinary rows. A previous import had no such gate and created
# 37 "students" with UIDs like '3.46', 'AI&ML' and '10.2', each with a login.
UID_RE = re.compile(r"^\d{2}-[A-Za-z&]+\d+-\d{2}$")


def is_uid(value) -> bool:
    text = clean_text(value)
    return bool(text and UID_RE.match(text))


def uid_batch(value) -> str | None:
    """``'22-CS&E18-26'`` -> ``'2026'``. Returns None if not a valid UID."""
    text = clean_text(value)
    if not text or not UID_RE.match(text):
        return None
    return "20" + text.rsplit("-", 1)[1]


# ---------------------------------------------------------------------------
# Scalars
# ---------------------------------------------------------------------------


def is_blank(value) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    return str(value).strip() in ("", "nan", "NaT", "None")


def clean_text(value) -> str | None:
    """Collapse whitespace (including the newlines Excel puts in headers)."""
    if is_blank(value):
        return None
    return re.sub(r"\s+", " ", str(value)).strip()


def clean_name(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    # Student names arrive SHOUTED in every file. Left as-is: that is how the
    # 1416 already-imported 2028 rows are stored, and mixing the two would make
    # name search behave differently by cohort.
    return text[:100]


def to_float(value) -> float | None:
    """Tolerates ``'6.25 LPA'``, ``'12,50,000'``, and rejects prose."""
    if is_blank(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(",", "").strip()
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def to_contact(value) -> str | None:
    """``9694365247.0`` -> ``'9694365247'``.

    Excel stores phone numbers as floats, so ``str()`` alone yields a trailing
    ``.0`` that does not fit the model's 15-char column meaningfully.
    """
    if is_blank(value):
        return None
    if isinstance(value, float) and value.is_integer():
        text = str(int(value))
    else:
        text = str(value).strip()
    digits = re.sub(r"\D", "", text)
    return digits[:15] or None


def to_date(value) -> dt.date | None:
    """Parse a cell that may be a real datetime, a string, or free prose.

    ``Date of Joining`` in the 2026 register mixes real dates with entries like
    ``'After graduation'`` and ``'After Completion of Sem-VIII (CB…)'`` — those
    return None rather than being coerced into a wrong date.
    """
    if is_blank(value):
        return None
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d %b %Y", "%d %B %Y"):
        try:
            return dt.datetime.strptime(text[:11].strip(), fmt).date()
        except ValueError:
            continue
    try:
        import pandas as pd

        parsed = pd.to_datetime(text, errors="coerce", dayfirst=True)
        if parsed is not None and not pd.isna(parsed):
            return parsed.date()
    except Exception:
        pass
    return None


def to_dob(value) -> str | None:
    """``Student.dob`` is a CharField(20), not a DateField. Normalise anyway."""
    parsed = to_date(value)
    if parsed:
        return parsed.isoformat()
    return clean_text(value)


# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------

# The canonical spellings are the ones already in the database from the 2028
# roster import. Everything else in this map is a variant observed in the
# source files that must fold onto them.
_DEPARTMENT_ALIASES = {
    "IOT": "IoT",
    "IOTA": "IoT-A",
    "M&ME": "MME",
    "MME": "MME",
    "MECH": "MECH",
    "CIVIL": "CIVIL",
    "CS&E": "CS&E",
    "E&CS": "E&CS",
    "AI&ML": "AI&ML",
    "AI&DS": "AI&DS",
    "COMP": "COMP",
    "IT": "IT",
    "E&TC": "E&TC",
}

# Divisions are a single trailing letter on some departments ("IT-A") and
# absent on others ("CS&E"). The 2027 cohort has undivided AI&ML while 2028 has
# AI&ML-A/B/C — that is a real difference between the cohorts, not a typo, so
# it is preserved rather than normalised away.
_DEPT_DIV_RE = re.compile(r"^(?P<dept>.+?)[-\s]*(?P<div>[A-Z])$")


def normalize_department(value) -> str | None:
    """``'IOT'`` -> ``'IoT'``, ``'M&ME'`` -> ``'MME'``, ``'Mech'`` -> ``'MECH'``."""
    text = clean_text(value)
    if not text:
        return None
    text = text.replace(" ", "")
    key = text.upper()

    if key in _DEPARTMENT_ALIASES:
        return _DEPARTMENT_ALIASES[key]

    # Split a trailing division letter, canonicalise the stem, reattach.
    match = _DEPT_DIV_RE.match(key)
    if match:
        stem, div = match.group("dept").rstrip("-"), match.group("div")
        if stem in _DEPARTMENT_ALIASES:
            return f"{_DEPARTMENT_ALIASES[stem]}-{div}"
        return f"{stem}-{div}"
    return key


def split_division(department: str | None, explicit=None) -> str:
    """Division from the explicit column if present, else the dept suffix."""
    explicit_text = clean_text(explicit)
    if explicit_text and len(explicit_text) <= 2:
        return explicit_text.upper()
    if department:
        match = _DEPT_DIV_RE.match(department.upper())
        if match:
            return match.group("div")
    return "A"


# ---------------------------------------------------------------------------
# Controlled vocabularies
# ---------------------------------------------------------------------------

# Student.consent_Type — exact values, the model has choices and the API
# filters on them.
_CONSENT_MAP = {
    "PLACEMENT": "placement",
    "PLACEMENT+AEDP/PLI": "placement+aedp/pli",
    "PLACEMENTAEDPPLI": "placement+aedp/pli",
    "HIGHERSTUDIES": "Higher studies",
    "HIGHERSTUDY": "Higher studies",
    "ENTREPRENEURSHIP": "Entrepreneurship",
}


def normalize_consent(value) -> str:
    text = clean_text(value)
    if not text:
        return "placement"
    key = re.sub(r"[\s_]", "", text).upper()
    return _CONSENT_MAP.get(key, "placement")


def normalize_gender(value) -> str:
    text = clean_text(value)
    if not text:
        return "Male"
    key = text.strip().upper()
    if key.startswith("F"):
        return "Female"
    if key.startswith("M"):
        return "Male"
    return text[:10]


def normalize_academic_year(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    key = text.upper().replace(".", "")
    for code in ("FE", "SE", "TE", "BE"):
        if key == code or key.startswith(code):
            return code
    return text[:30]


# StudentOffer.OFFER_TYPE_CHOICES. The register's "Type of Placement" column
# carries five distinct values across the two files: Regular, PLI, AEDP,
# Normal, HackwithInfy.
def normalize_offer_type(value) -> str:
    text = clean_text(value)
    if not text:
        return "PLACEMENT"
    key = text.upper()
    if "AEDP" in key and "PLI" in key:
        return "AEDP_PLI"
    if "PLI" in key:
        return "AEDP_PLI"
    if "AEDP" in key or "OJT" in key:
        return "AEDP_OJT"
    return "PLACEMENT"


def offer_role_label(value) -> str:
    """What goes in ``StudentOffer.role``.

    The registers have no job-title column — they record the *scheme* a student
    was placed under. That matters because ``StudentOffer`` has
    ``unique_together = (student, company, role)``: the previous import wrote a
    hardcoded ``'Software Engineer'`` for every row, so a student holding both a
    Regular offer and a PLI offer from the same employer collapsed into one.

    Using the scheme as the role keeps those distinct and is the most
    informative value actually present in the file. It does mean the dashboard's
    "top job roles" chart reads Regular/PLI/AEDP rather than job titles — which
    is honest, since the source has no job titles.
    """
    text = clean_text(value)
    if not text:
        return "Placement"
    return text[:255]


def normalize_offer_status(remark, joining_date) -> str:
    """StudentOffer.OFFER_STATUS_CHOICES.

    The register lists confirmed outcomes, so the floor is ``accepted``. Four
    spellings of "offer rejected" appear across 28 rows; a parsed joining date
    means the student actually joined.
    """
    text = clean_text(remark)
    if text and "REJECT" in text.upper():
        return "rejected"
    if joining_date:
        return "joined"
    return "accepted"


def normalize_campus(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    key = text.upper()
    if key.startswith("ON"):
        return "ON"
    if key.startswith("OFF"):
        return "OFF"
    return None
