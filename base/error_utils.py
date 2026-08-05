import logging
import uuid

logger = logging.getLogger(__name__)

GENERIC_ERROR_MESSAGE = "An unexpected error occurred. Please try again or contact support."


def safe_error_payload(exc):
    """Log the real exception server-side and return a client-safe error body with a correlation id."""
    correlation_id = str(uuid.uuid4())
    logger.exception("Unhandled error [%s]", correlation_id)
    return {"error": GENERIC_ERROR_MESSAGE, "correlation_id": correlation_id}


def drf_exception_handler(exc, context):
    """Global DRF safety net: known/handled exceptions keep DRF's normal (already-safe) response;
    anything unhandled falls back to a generic message + correlation id instead of propagating
    a raw traceback."""
    from rest_framework.views import exception_handler as drf_default_exception_handler
    from rest_framework.response import Response

    response = drf_default_exception_handler(exc, context)
    if response is not None:
        return response
    return Response(safe_error_payload(exc), status=500)


def handle_500(request):
    """Django (non-DRF) 500 handler: generic JSON message + correlation id instead of the default error page."""
    from django.http import JsonResponse

    return JsonResponse(safe_error_payload(Exception("Unhandled server error")), status=500)
