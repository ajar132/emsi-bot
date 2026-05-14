from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from .models import FAQEntry
from .serializers import FAQEntrySerializer
from .services import regenerate_embedding


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ADMIN', 'SUPER_ADMIN')


class FAQEntryViewSet(viewsets.ModelViewSet):
    queryset = FAQEntry.objects.all()
    serializer_class = FAQEntrySerializer
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question', 'category']
    ordering_fields = ['created_at', 'updated_at', 'hit_count']
    ordering = ['-updated_at']

    def perform_create(self, serializer):
        faq = serializer.save(created_by=self.request.user)
        try:
            regenerate_embedding(faq)
        except Exception:
            pass  # saved without embedding; vector search won't match until Gemini key is set

    def perform_update(self, serializer):
        faq = serializer.save()
        try:
            regenerate_embedding(faq)
        except Exception:
            pass
