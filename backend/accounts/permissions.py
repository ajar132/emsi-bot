from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Admin ou Super-admin."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("ADMIN", "SUPER_ADMIN")
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "SUPER_ADMIN"


class IsOwner(BasePermission):
    """L'objet doit appartenir au user (objet.user == request.user)."""
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "user", None) == request.user