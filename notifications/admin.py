from django.contrib import admin
from .models import Notification, NotificationRead


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "category",
        "target_audience",
        "creator",
        "created_at",
    )
    list_filter = ("category", "target_audience", "created_at")
    search_fields = ("title", "message", "creator__email", "creator__full_name")
    readonly_fields = ("created_at", "updated_at", "creator")
    filter_horizontal = ("recipients",)


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ("notification", "user", "read_at")
    list_filter = ("read_at",)
    search_fields = ("notification__title", "user__email")
    readonly_fields = ("read_at",)
