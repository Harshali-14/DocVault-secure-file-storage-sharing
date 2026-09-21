from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = "login", "Login"
        UPLOAD = "upload", "Upload"
        PREVIEW = "preview", "Preview"
        DOWNLOAD = "download", "Download"
        SHARE = "share", "Share"
        REVOKE_SHARE = "revoke_share", "Revoke Share"
        RENAME = "rename", "Rename"
        MOVE = "move", "Move"
        TRASH = "trash", "Trash"
        RESTORE = "restore", "Restore"
        PERMANENT_DELETE = "permanent_delete", "Permanent Delete"
        CREATE_FOLDER = "create_folder", "Create Folder"
        DELETE_FOLDER = "delete_folder", "Delete Folder"
        STAR = "star", "Starred"
        UNSTAR = "unstar", "Unstarred"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )

    action = models.CharField(
        max_length=30,
        choices=Action.choices,
    )

    file = models.ForeignKey(
        "files.File",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    folder = models.ForeignKey(
        "folders.Folder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="targeted_activity_logs",
    )

    description = models.CharField(max_length=500)

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.created_at}"