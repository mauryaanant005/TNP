"""Finding the spreadsheets and locating the real data inside them.

Two very different shapes live in the same folder:

``ROSTER``    18 tidy columns, header on row 0, one row per student. This is the
              only source of personal details — name, email, DOB, marks.

``REGISTER``  The "Students Placement Register" workbooks. One row per *offer*,
              header on row 5 of a date-named sheet, and — critically — the
              data block is surrounded by signature lines, per-branch pivots and
              salary summaries that pandas reads as ordinary rows. Callers must
              gate every row on :func:`dataimport.normalize.is_uid`.

Discovery is by content, not filename: filenames here are inconsistent
(``2028 Batch.xlsx`` vs ``Batch_2027_Extracted_Output.xlsx``) and a file
renamed by hand should still import correctly.
"""

from __future__ import annotations

import warnings
from dataclasses import dataclass
from pathlib import Path

ROSTER = "roster"
REGISTER = "register"

# The 18-column roster contract, as produced for the 2027 and 2028 batches.
ROSTER_COLUMNS = {
    "uid", "department", "full_name", "email", "batch", "academic_year",
}

# The register's UID header, in the spellings seen across the workbooks.
REGISTER_UID_HEADERS = ("t&p(uid)", "t&p (uid)", "uid")


@dataclass
class Source:
    path: Path
    kind: str
    sheet: str
    header_row: int
    batch: str | None = None

    @property
    def name(self) -> str:
        return self.path.name


def _read_excel(path, **kwargs):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        import pandas as pd

        return pd.read_excel(path, **kwargs)


def _sheet_names(path):
    import pandas as pd

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return pd.ExcelFile(path).sheet_names


def _norm_header(value) -> str:
    return str(value).replace("\n", " ").strip().lower()


def classify(path: Path) -> Source | None:
    """Work out what a workbook is, and where its header row sits."""
    path = Path(path)
    try:
        sheets = _sheet_names(path)
    except Exception:
        return None

    # -- roster? header is row 0 of the first sheet ------------------------
    try:
        head = _read_excel(path, sheet_name=sheets[0], nrows=1)
        columns = {_norm_header(c) for c in head.columns}
        if ROSTER_COLUMNS.issubset(columns):
            batch = None
            sample = _read_excel(path, sheet_name=sheets[0], usecols=["batch"], nrows=5)
            values = [str(v).strip() for v in sample["batch"].dropna().tolist()]
            if values:
                batch = values[0].split(".")[0]
            return Source(path, ROSTER, sheets[0], 0, batch)
    except Exception:
        pass

    # -- register? scan the first 12 rows of each sheet for the UID header --
    for sheet in sheets:
        try:
            probe = _read_excel(path, sheet_name=sheet, header=None, nrows=12)
        except Exception:
            continue
        for index in range(len(probe)):
            cells = [_norm_header(v) for v in probe.iloc[index].tolist()]
            if any(cell in REGISTER_UID_HEADERS for cell in cells):
                return Source(path, REGISTER, sheet, index, _batch_from_name(path.name))
    return None


def _batch_from_name(name: str) -> str | None:
    """``'Students Placement Register Batch-2026 30052026.xls'`` -> ``'2026'``.

    Only used as a *hint*. The importer trusts each row's own UID suffix and
    reports rows that disagree — the filename being wrong is exactly how the
    previous import filed the whole 2026 cohort under batch 2028.
    """
    import re

    match = re.search(r"Batch[-_ ]?(20\d{2})", name, re.IGNORECASE)
    if match:
        return match.group(1)
    match = re.search(r"(20\d{2})", name)
    return match.group(1) if match else None


def discover(directory, batches=None) -> list[Source]:
    """All importable workbooks in *directory*, optionally limited to *batches*."""
    directory = Path(directory)
    found = []
    for path in sorted(directory.glob("*.xls*")):
        if path.name.startswith("~$"):  # Excel lock files
            continue
        source = classify(path)
        if source is None:
            continue
        if batches and source.batch not in batches:
            continue
        found.append(source)
    # Rosters first: they carry the personal details, so a register row for a
    # student the roster also covers should attach to the full record, not
    # create a stub that the roster then has to repair.
    found.sort(key=lambda s: (s.kind != ROSTER, s.name))
    return found


def load(source: Source):
    """The sheet as a DataFrame, with headers de-newlined and stripped."""
    frame = _read_excel(source.path, sheet_name=source.sheet, header=source.header_row)
    frame.columns = [str(c).replace("\n", " ").strip() for c in frame.columns]
    return frame


def find_column(frame, *candidates):
    """First column whose header contains any of *candidates* (case-insensitive).

    The register headers carry stray double spaces and trailing units
    (``'Salary offered for Placement   ( INR-LPA.)'``), so exact matching is
    not an option.
    """
    lowered = [(c, str(c).lower()) for c in frame.columns]
    for candidate in candidates:
        needle = candidate.lower()
        for column, text in lowered:
            if text == needle:
                return column
    for candidate in candidates:
        needle = candidate.lower()
        for column, text in lowered:
            if needle in text:
                return column
    return None
