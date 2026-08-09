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

    #: Views prefetch the requesting user's read rows into this attribute.
    #: See `NotificationListCreate.get_queryset`.
    READS_ATTR = "reads_by_requester"

    def get_is_read(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        # `obj.read_by.filter(...)` looks like it uses the prefetch cache. It
        # does not — any filter() on a related manager builds a fresh queryset
        # and issues a query per object. That was a real N+1: 50 notifications
        # on a page meant 50 extra queries.
        #
        # The views instead prefetch only *this user's* read rows (a handful,
        # not every user's) into READS_ATTR, so this is a list membership test
        # with no query at all.
        prefetched = getattr(obj, self.READS_ATTR, None)
        if prefetched is not None:
            return bool(prefetched)

        # Fallback for callers that did not prefetch — a single object, so one
        # query is correct rather than N.
        return obj.read_by.filter(user=request.user).exists()
