from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok", "service": "EMSI-Bot API", "version": "1.0"})

urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("chat.urls")),
    path("api/", include("runner.urls")),
    path("api/", include("core.urls")),
    path("api/", include("knowledge.urls")),
]
