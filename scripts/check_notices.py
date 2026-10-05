import os
import django

import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, "/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    if connection.vendor == "sqlite":
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%notice%';")
    else:
        cursor.execute("SHOW TABLES LIKE '%notice%';")
    print("Notice tables:", cursor.fetchall())

from placements.models import Notice as PlacementNotice, CompanyRegistration
from internship_api.models import InternshipNotice, InternshipRegistration

print("PlacementNotice count:", PlacementNotice.objects.count())
for n in PlacementNotice.objects.all()[:5]:
    print(" - PlacementNotice:", n.id, n.subject, n.date, n.location)

print("InternshipNotice count:", InternshipNotice.objects.count())
for n in InternshipNotice.objects.all()[:5]:
    print(" - InternshipNotice:", n.id, n.subject, n.date, n.location)

print("CompanyRegistration (Placements) count:", CompanyRegistration.objects.count())
for c in CompanyRegistration.objects.all()[:5]:
    print(" - Placement Company:", c.id, c.name, c.batch, "has notice:", hasattr(c, 'notice') and c.notice is not None)

print("InternshipRegistration count:", InternshipRegistration.objects.count())
for c in InternshipRegistration.objects.all()[:5]:
    print(" - Internship Company:", c.id, c.name, c.batch)
