from rest_framework import serializers

from .models import Folder


class FolderSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Folder
        fields = (
            "id",
            "owner",
            "name",
            "parent",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "created_at",
            "updated_at",
        )

    def validate_parent(self, parent):
        if parent is None:
            return parent

        request = self.context.get("request")

        if request and parent.owner_id != request.user.id:
            raise serializers.ValidationError(
                "You do not have permission to use this folder as a parent."
            )

        return parent