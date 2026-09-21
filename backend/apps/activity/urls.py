from django.urls import include, path
from .views import ActivityListView


urlpatterns = [
    path("", ActivityListView.as_view(), name="activity-list"),
]