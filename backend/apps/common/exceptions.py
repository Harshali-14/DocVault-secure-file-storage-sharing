from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data

        if isinstance(data, dict):
            if "detail" in data:
                message = str(data["detail"])
            else:
                # Preserve serializer field-level validation errors
                message = data

        elif isinstance(data, list) and data:
            message = str(data[0])

        else:
            message = "Request could not be completed."

        response.data = {
            "error": message,
            "status_code": response.status_code,
        }

        return response

    logger.exception("Unhandled exception", exc_info=exc)

    return Response(
        {
            "error": "An unexpected error occurred.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )