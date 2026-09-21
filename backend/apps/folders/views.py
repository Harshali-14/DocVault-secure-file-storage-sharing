from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.activity.models import ActivityLog
from apps.activity.utils import log_activity

from .models import Folder
from .serializers import FolderSerializer


class FolderListCreateView(generics.ListCreateAPIView):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Folder.objects
            .filter(owner=self.request.user)
            .select_related("owner", "parent")
            .order_by("name")
        )

    def perform_create(self, serializer):
        folder = serializer.save(owner=self.request.user)

        log_activity(
            user=self.request.user,
            action=ActivityLog.Action.CREATE_FOLDER,
            request=self.request,
            folder=folder,
            description=f"Created folder '{folder.name}'",
        )


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(
            owner=self.request.user
        )

    def perform_destroy(self, instance):
        folder_name = instance.name

        log_activity(
            user=self.request.user,
            action=ActivityLog.Action.DELETE_FOLDER,
            request=self.request,
            folder=instance,
            description=f"Deleted folder '{folder_name}'",
        )

        instance.delete()