from django.conf import settings
from django.db import models


class File(models.Model):

    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        SHARED = "shared", "Shared"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="files",
    )

    folder = models.ForeignKey(
        "folders.Folder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="files",
    )

    name = models.CharField(max_length=255)

    file = models.FileField(upload_to="documents/%Y/%m/")

    size = models.PositiveBigIntegerField(default=0)

    mime_type = models.CharField(max_length=255, blank=True)

    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PRIVATE,
    )

    is_starred = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    is_deleted = models.BooleanField(default=False)

    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
        models.UniqueConstraint(
            fields=["owner", "folder", "name"],
            name="unique_file_name_per_owner_folder",
        ),
        models.UniqueConstraint(
            fields=["owner", "name"],
            condition=models.Q(folder__isnull=True),
            name="unique_root_file_name_per_owner",
        ),
    ]