from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ActivityLog


class ActivityListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ActivityLog.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        activities = self.get_queryset()

        return Response([
            {
                "id": activity.id,
                "action": activity.action,
                "description": activity.description,
                "created_at": activity.created_at,
            }
            for activity in activities[:100]
        ])