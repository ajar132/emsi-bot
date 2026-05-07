from django.urls import path
from .views import ExecuteView

urlpatterns = [
    path("execute/", ExecuteView.as_view(), name="execute"),
]