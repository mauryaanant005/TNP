from django.core.management.base import BaseCommand
import tablib
from student.resources import StudentResource
from base.models import User
import uuid

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Create an existing user
        User.objects.get_or_create(email='email1@test.com', defaults={'full_name': 'Existing User', 'password': '123'})
        
        dataset = tablib.Dataset(headers=['uid', 'email', 'full_name', 'department', 'academic_year', 'current_category', 'is_dse_student'])
        dataset.append(['uid3', 'email1@test.com', 'Test User', 'CS', '2023', 'Category 1', False])
        dataset.append(['uid4', 'email1@test.com', 'Test User 2', 'CS', '2023', 'Category 1', False])
        
        resource = StudentResource()
        try:
            result = resource.import_data(dataset, dry_run=False)
            print("Import Result:", result.has_errors())
            if result.has_errors():
                for error in result.row_errors():
                    print(error)
        except Exception as e:
            print(f"Exception during import: {e}")
