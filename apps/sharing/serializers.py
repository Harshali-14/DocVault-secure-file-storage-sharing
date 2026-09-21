from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.files.models import File
from .models import FileShare


User = get_user_model()


class FileShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(
        write_only=True,
        required=True,
    )

    recipient = serializers.SerializerMethodField()
    file_name = serializers.CharField(
        source="file.name",
        read_only=True,
    )
    owner_email = serializers.EmailField(
        source="file.owner.email",
        read_only=True,
    )

    class Meta:
        model = FileShare
        fields = (
            "id",
            "file",
            "file_name",
            "owner_email",
            "shared_with_email",
            "recipient",
            "created_at",
            "expires_at",
            "revoked_at",
        )
        read_only_fields = (
            "id",
            "file",
            "file_name",
            "owner_email",
            "recipient",
            "created_at",
            "revoked_at",
        )

    def validate(self, attrs):
        request = self.context.get("request")
        file_instance = self.context.get("file")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if file_instance is None:
            raise serializers.ValidationError(
                "File could not be found."
            )

        if file_instance.owner_id != request.user.id:
            raise serializers.ValidationError(
                "Only the file owner can share this file."
            )

        if file_instance.is_deleted:
            raise serializers.ValidationError(
                "Deleted files cannot be shared."
            )

        email = attrs.pop("shared_with_email").strip().lower()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "shared_with_email": (
                        "No user exists with this email address."
                    )
                }
            )

        if user.id == request.user.id:
            raise serializers.ValidationError(
                {
                    "shared_with_email": (
                        "You cannot share a file with yourself."
                    )
                }
            )

        if FileShare.objects.filter(
            file=file_instance,
            shared_with=user,
            revoked_at__isnull=True,
        ).exists():
            raise serializers.ValidationError(
                {
                    "shared_with_email": (
                        "This file is already shared with this user."
                    )
                }
            )

        attrs["shared_with"] = user
        attrs["file"] = file_instance

        return attrs

    def get_recipient(self, obj):
        return {
            "id": obj.shared_with_id,
            "username": obj.shared_with.username,
            "email": obj.shared_with.email,
        }