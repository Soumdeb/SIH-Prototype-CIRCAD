# circad/backend/api/permissions.py
from rest_framework.permissions import BasePermission

class IsTechnician(BasePermission):
    """
    Allow access only to users in the Technician group.
    """
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return user.groups.filter(name="Technician").exists() or user.is_staff

class IsViewer(BasePermission):
    """
    Allow access only to users in the Viewer group.
    """
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return user.groups.filter(name="Viewer").exists() or user.is_staff
