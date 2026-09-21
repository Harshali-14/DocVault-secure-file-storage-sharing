from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
        )

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "date_joined",
        )


class ChangePasswordSerializer(serializers.Serializer):

    current_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        user = self.context["request"].user

        # Check current password
        if not user.check_password(
            attrs["current_password"]
        ):
            raise serializers.ValidationError({
                "current_password":
                    "Current password is incorrect."
            })

        # Check confirmation
        if (
            attrs["new_password"]
            != attrs["confirm_password"]
        ):
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        # Prevent reusing the same password
        if (
            attrs["current_password"]
            == attrs["new_password"]
        ):
            raise serializers.ValidationError({
                "new_password":
                    "New password must be different from your current password."
            })

        # Django's configured password validators
        validate_password(
            attrs["new_password"],
            user=user,
        )

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user


class DeleteAccountSerializer(serializers.Serializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    def validate_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Password is incorrect."
            )

        return value