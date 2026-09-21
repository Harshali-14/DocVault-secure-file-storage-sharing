from django.db import models
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.files.models import File
from .models import FileShare
from .serializers import FileShareSerializer


class FileShareCreateView(generics.CreateAPIView):
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]

    def get_file(self):
        return File.objects.filter(
            pk=self.kwargs["file_id"],
            owner=self.request.user,
            is_deleted=False,
        ).first()

    def create(self, request, *args, **kwargs):
        file_instance = self.get_file()

        if file_instance is None:
            return Response(
                {"error": "File not found or you do not have permission to share it."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request,
                "file": file_instance,
            },
        )
        serializer.is_valid(raise_exception=True)
        share = serializer.save()

        return Response(
            FileShareSerializer(
                share,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class FileShareListView(generics.ListAPIView):
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            FileShare.objects
            .filter(
                file__owner=self.request.user,
                revoked_at__isnull=True,
            )
            .select_related(
                "file",
                "file__owner",
                "shared_with",
            )
        )


class SharedWithMeView(generics.ListAPIView):
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()

        return (
            FileShare.objects
            .filter(
                shared_with=self.request.user,
                revoked_at__isnull=True,
            )
            .filter(
                models.Q(expires_at__isnull=True) |
                models.Q(expires_at__gt=now)
            )
            .select_related(
                "file",
                "file__owner",
                "shared_with",
            )
        )


class FileShareRevokeView(generics.DestroyAPIView):
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FileShare.objects.filter(
            file__owner=self.request.user,
            revoked_at__isnull=True,
        )

    def perform_destroy(self, instance):
        instance.revoked_at = timezone.now()
        instance.save(update_fields=["revoked_at"])