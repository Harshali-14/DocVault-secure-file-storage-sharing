from django.conf import settings
from django.db import models


class FileShare(models.Model):
    file = models.ForeignKey(
        "files.File",
        on_delete=models.CASCADE,
        related_name="shares",
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shared_files",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["file", "shared_with"],
                condition=models.Q(revoked_at__isnull=True),
                name="unique_active_file_share",
            )
        ]

    def __str__(self):
        return f"{self.file.name} → {self.shared_with.email}"