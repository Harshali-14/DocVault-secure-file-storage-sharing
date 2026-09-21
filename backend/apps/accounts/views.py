from django.contrib.auth import logout
from django.db import transaction

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.activity.models import ActivityLog
from apps.activity.utils import log_activity

from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        log_activity(
            user=self.user,
            action=ActivityLog.Action.LOGIN,
            request=self.context["request"],
            description="User logged in",
        )

        return data


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class ProfileView(generics.RetrieveUpdateAPIView):

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


class DeleteAccountView(generics.GenericAPIView):

    serializer_class = DeleteAccountSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = request.user
        user_id = user.id

        # -------------------------------------------------
        # 1. Delete uploaded physical files
        # -------------------------------------------------

        try:
            from apps.files.models import File

            user_files = File.objects.filter(owner=user)

            for file_object in user_files:
                if file_object.file:
                    file_object.file.delete(save=False)

        except ImportError:
            pass

        # -------------------------------------------------
        # 2. Blacklist refresh token
        # -------------------------------------------------

        refresh_token = request.data.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # The account should still be deleted even
                # if the supplied refresh token is invalid.
                pass

        # -------------------------------------------------
        # 3. Delete the Django session
        # -------------------------------------------------

        logout(request)

        # -------------------------------------------------
        # 4. Delete user and related database records
        # -------------------------------------------------

        user.delete()

        return Response(
            {
                "message": "Account deleted successfully.",
                "user_id": user_id,
            },
            status=status.HTTP_200_OK,
        )