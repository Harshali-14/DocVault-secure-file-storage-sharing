from django.urls import path

from .views import (
    FileShareCreateView,
    FileShareListView,
    FileShareRevokeView,
    SharedWithMeView,
)


urlpatterns = [
    path(
        "files/<int:file_id>/",
        FileShareCreateView.as_view(),
        name="file-share-create",
    ),
    path(
        "my-shares/",
        FileShareListView.as_view(),
        name="file-share-list",
    ),
    path(
        "shared-with-me/",
        SharedWithMeView.as_view(),
        name="shared-with-me",
    ),
    path(
        "<int:pk>/revoke/",
        FileShareRevokeView.as_view(),
        name="file-share-revoke",
    ),
]