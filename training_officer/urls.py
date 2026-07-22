from django.urls import path
from .views import get_avg_data

urlpatterns = [
    path("get-avg-data/<str:table_name>/", get_avg_data, name="get_avg_data"),
]
