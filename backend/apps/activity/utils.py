from .models import ActivityLog


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def log_activity(
    *,
    user,
    action,
    request=None,
    file=None,
    folder=None,
    target_user=None,
    description="",
):
    ip_address = None

    if request is not None:
        ip_address = get_client_ip(request)

    return ActivityLog.objects.create(
        user=user,
        action=action,
        file=file,
        folder=folder,
        target_user=target_user,
        description=description,
        ip_address=ip_address,
    )