from django.urls import path
from .views import (
    NotificationListCreate,
    NotificationDetail,
    NotificationMarkRead,
    NotificationUnreadCount,
)

urlpatterns = [
    path("", NotificationListCreate.as_view(), name="notification-list-create"),
    path("unread-count/", NotificationUnreadCount.as_view(), name="notification-unread-count"),
    path("<int:pk>/", NotificationDetail.as_view(), name="notification-detail"),
    path("<int:pk>/mark-read/", NotificationMarkRead.as_view(), name="notification-mark-read"),
]