from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from staff.models import CompanyRegistration
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def get_paginated_response(self, data):
        batch = self.request.parser_context['view'].kwargs.get('batch')
        companies = CompanyRegistration.objects.filter(batch=batch)
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