from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FAQEntryViewSet

router = DefaultRouter()
router.register('faq', FAQEntryViewSet, basename='faq')

urlpatterns = [
    path('', include(router.urls)),
]
