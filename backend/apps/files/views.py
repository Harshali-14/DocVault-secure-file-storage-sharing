from django.db.models import Q, Sum
from django.http import FileResponse
from django.utils import timezone

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.activity.models import ActivityLog
from apps.activity.utils import log_activity

from .models import File
from .serializers import (
    FileSerializer,
    FileUploadSerializer,
    FileRenameSerializer,
    FileMoveSerializer,
)


@extend_schema_view(
    post=extend_schema(
        request=FileUploadSerializer,
        responses=FileSerializer,
        description="Upload a file to the authenticated user's vault.",
    )
)
class FileListCreateView(generics.ListCreateAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["folder", "visibility", "is_starred", "mime_type"]
    search_fields = ["name", "mime_type"]
    ordering_fields = ["created_at", "updated_at", "name", "size"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            File.objects
            .filter(
                owner=self.request.user,
                is_deleted=False,
            )
            .select_related("owner", "folder")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        upload_serializer = FileUploadSerializer(
            data=request.data,
            context={"request": request},
        )

        upload_serializer.is_valid(raise_exception=True)

        uploaded_file = upload_serializer.validated_data["file"]

        file_instance = File.objects.create(
            owner=request.user,
            folder=upload_serializer.validated_data.get("folder"),
            name=(
                upload_serializer.validated_data.get("name")
                or uploaded_file.name
            ),
            file=uploaded_file,
            size=uploaded_file.size,
            mime_type=uploaded_file.content_type or "",
            visibility=upload_serializer.validated_data.get(
                "visibility",
                File.Visibility.PRIVATE,
            ),
        )

        # Activity: upload
        log_activity(
            user=request.user,
            action=ActivityLog.Action.UPLOAD,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=f"Uploaded file '{file_instance.name}'",
        )

        response_serializer = FileSerializer(
            file_instance,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )
class FileRecentView(generics.ListAPIView):
    """
    Return files recently accessed by the authenticated user.

    Recent activity is based on preview/download actions.
    Only files that are currently accessible to the user
    and have not been deleted are returned.
    """

    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        recent_file_ids = (
            ActivityLog.objects
            .filter(
                user=user,
                action__in=[
                    ActivityLog.Action.PREVIEW,
                    ActivityLog.Action.DOWNLOAD,
                ],
                file__isnull=False,
                file__is_deleted=False,
            )
            .order_by("-created_at")
            .values_list("file_id", flat=True)
        )

        # Remove duplicate file IDs while preserving recent ordering.
        file_ids = list(dict.fromkeys(recent_file_ids))[:50]

        if not file_ids:
            return File.objects.none()

        preserved_order = {file_id: index for index, file_id in enumerate(file_ids)}

        files = (
            File.objects
            .filter(
                id__in=file_ids,
                is_deleted=False,
            )
            .select_related("owner", "folder")
        )

        return sorted(
            files,
            key=lambda file: preserved_order[file.id],
        )

class FileStarToggleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False,
        )

    def patch(self, request, *args, **kwargs):
        file_instance = self.get_object()

        file_instance.is_starred = not file_instance.is_starred

        file_instance.save(
            update_fields=[
                "is_starred",
                "updated_at",
            ]
        )

        action = (
            ActivityLog.Action.STAR
            if file_instance.is_starred
            else ActivityLog.Action.UNSTAR
        )

        log_activity(
            user=request.user,
            action=action,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=(
                f"{'Starred' if file_instance.is_starred else 'Unstarred'} "
                f"file '{file_instance.name}'"
            ),
        )

        serializer = FileSerializer(
            file_instance,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
        
class FileStarredView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            File.objects
            .filter(
                owner=self.request.user,
                is_deleted=False,
                is_starred=True,
            )
            .select_related("owner", "folder")
            .order_by("-updated_at")
        )

class FileStorageView(generics.GenericAPIView):
    """
    Return storage usage for the authenticated user's vault.

    Only non-deleted files are counted toward storage usage.
    """

    permission_classes = [IsAuthenticated]

    TOTAL_STORAGE = 5 * 1024 * 1024 * 1024  # 5 GB

    def get(self, request, *args, **kwargs):
        used_storage = (
            File.objects
            .filter(
                owner=request.user,
                is_deleted=False,
            )
            .aggregate(total=Sum("size"))
            ["total"]
            or 0
        )

        available_storage = max(
            self.TOTAL_STORAGE - used_storage,
            0,
        )

        percentage = round(
            (used_storage / self.TOTAL_STORAGE) * 100,
            2,
        )

        return Response(
            {
                "used": used_storage,
                "total": self.TOTAL_STORAGE,
                "available": available_storage,
                "percentage": percentage,
            },
            status=status.HTTP_200_OK,
        )

class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            File.objects
            .filter(
                owner=self.request.user,
                is_deleted=False,
            )
            .select_related("owner", "folder")
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()

        instance.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
            ]
        )

        # Activity: move to trash
        log_activity(
            user=self.request.user,
            action=ActivityLog.Action.TRASH,
            request=self.request,
            file=instance,
            folder=instance.folder,
            description=f"Moved file '{instance.name}' to trash",
        )


class FileRestoreView(generics.GenericAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=True,
        )

    def post(self, request, *args, **kwargs):
        file_instance = self.get_object()

        file_instance.is_deleted = False
        file_instance.deleted_at = None

        file_instance.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
            ]
        )

        # Activity: restore
        log_activity(
            user=request.user,
            action=ActivityLog.Action.RESTORE,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=f"Restored file '{file_instance.name}'",
        )

        serializer = self.get_serializer(
            file_instance,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


def get_accessible_file(user, file_id):
    """
    Return a file when the authenticated user is either:
    - the file owner, or
    - an active recipient of the file.

    Expired, revoked, deleted, or unrelated files are not accessible.
    """

    now = timezone.now()

    return (
        File.objects
        .filter(
            pk=file_id,
            is_deleted=False,
        )
        .filter(
            Q(owner=user)
            |
            (
                Q(
                    shares__shared_with=user,
                    shares__revoked_at__isnull=True,
                )
                &
                (
                    Q(shares__expires_at__isnull=True)
                    |
                    Q(shares__expires_at__gt=now)
                )
            )
        )
        .distinct()
        .first()
    )


class FileDownloadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        file_instance = get_accessible_file(
            request.user,
            kwargs["pk"],
        )

        if file_instance is None:
            return Response(
                {
                    "error": (
                        "You do not have permission "
                        "to download this file."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not file_instance.file:
            return Response(
                {"error": "File is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Activity: download
        log_activity(
            user=request.user,
            action=ActivityLog.Action.DOWNLOAD,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=f"Downloaded file '{file_instance.name}'",
        )

        response = FileResponse(
            file_instance.file.open("rb"),
            as_attachment=True,
            filename=file_instance.name,
        )

        if file_instance.mime_type:
            response["Content-Type"] = file_instance.mime_type

        return response


class FilePreviewView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        file_instance = get_accessible_file(
            request.user,
            kwargs["pk"],
        )

        if file_instance is None:
            return Response(
                {
                    "error": (
                        "You do not have permission "
                        "to preview this file."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not file_instance.file:
            return Response(
                {"error": "File is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Activity: preview
        log_activity(
            user=request.user,
            action=ActivityLog.Action.PREVIEW,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=f"Previewed file '{file_instance.name}'",
        )

        response = FileResponse(
            file_instance.file.open("rb"),
            as_attachment=False,
            filename=file_instance.name,
        )

        if file_instance.mime_type:
            response["Content-Type"] = file_instance.mime_type

        return response


class FileRenameView(generics.GenericAPIView):
    serializer_class = FileRenameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False,
        )

    def patch(self, request, *args, **kwargs):
        file_instance = self.get_object()

        serializer = self.get_serializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        old_name = file_instance.name
        new_name = serializer.validated_data["name"]

        file_instance.name = new_name

        file_instance.save(
            update_fields=[
                "name",
                "updated_at",
            ]
        )

        # Activity: rename
        log_activity(
            user=request.user,
            action=ActivityLog.Action.RENAME,
            request=request,
            file=file_instance,
            folder=file_instance.folder,
            description=(
                f"Renamed file from '{old_name}' "
                f"to '{new_name}'"
            ),
        )

        response_serializer = FileSerializer(
            file_instance,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class FileMoveView(generics.GenericAPIView):
    serializer_class = FileMoveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False,
        )

    def patch(self, request, *args, **kwargs):
        file_instance = self.get_object()

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        old_folder = file_instance.folder
        new_folder = serializer.validated_data.get("folder")

        file_instance.folder = new_folder

        file_instance.save(
            update_fields=[
                "folder",
                "updated_at",
            ]
        )

        old_folder_name = (
            old_folder.name if old_folder else "Root"
        )

        new_folder_name = (
            new_folder.name if new_folder else "Root"
        )

        # Activity: move
        log_activity(
            user=request.user,
            action=ActivityLog.Action.MOVE,
            request=request,
            file=file_instance,
            folder=new_folder,
            description=(
                f"Moved file '{file_instance.name}' "
                f"from '{old_folder_name}' "
                f"to '{new_folder_name}'"
            ),
        )

        response_serializer = FileSerializer(
            file_instance,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class FileTrashView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            File.objects
            .filter(
                owner=self.request.user,
                is_deleted=True,
            )
            .select_related("owner", "folder")
            .order_by("-deleted_at")
        )


class FilePermanentDeleteView(generics.DestroyAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=True,
        )

    def perform_destroy(self, instance):
        file_name = instance.name
        folder = instance.folder

        # Log before deleting the database record.
        log_activity(
            user=self.request.user,
            action=ActivityLog.Action.PERMANENT_DELETE,
            request=self.request,
            file=instance,
            folder=folder,
            description=f"Permanently deleted file '{file_name}'",
        )

        # Delete the actual uploaded file from storage.
        if instance.file:
            instance.file.delete(save=False)

        # Permanently remove the database record.
        instance.delete()