from rest_framework import serializers
from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializes Notification instances for list and detail views.

    Extra read-only fields:
    - creator_name: full name of the creator (avoids a separate user lookup on the frontend)
    - is_read: whether the requesting user has opened this notification
    """

    creator_name = serializers.CharField(source="creator.full_name", read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "category",
            "target_audience",
            "target_departments",
            "target_academic_years",
            "files",
            "created_at",
            "creator",
            "creator_name",
            "is_read",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "creator",
            "creator_name",
            "is_read",
        ]

    def get_is_read(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        # Uses prefetched queryset when available — avoids N+1
        return obj.read_by.filter(user=request.user).exists()
