from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from staff.models import CompanyRegistration
class StandardResultsSetPagination(PageNumberPagination):
    # Kept small deliberately: each row renders company_headers × 8 progress-
    # field columns in the frontend table (StudentPerformance.tsx), so a large
    # page_size combined with many real companies can force a very wide,
    # synchronously-rendered grid. page_size_query_param still lets callers
    # opt into a bigger page explicitly.
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def get_paginated_response(self, data):
        companies = getattr(self, 'active_companies', None)
        if companies is None:
            batch = self.request.parser_context['view'].kwargs.get('batch')
            companies = CompanyRegistration.objects.filter(batch=batch)
            
        if isinstance(companies, list):
            company_headers = [{'id': c.id, 'name': c.name} for c in companies]
        else:
            company_headers = list(companies.values('id', 'name'))
        progress_fields = [
            'eligible', 'registered', 'aptitude_test', 'coding_test',
            'technical_interview', 'gd', 'hr_interview', 'selected'
        ]

        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'company_headers': company_headers,
            'progress_fields': progress_fields,
            'student_data': data
        })