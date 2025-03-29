from rest_framework.permissions import BasePermission, IsAuthenticated

class IsAdminUser(IsAuthenticated):
    """
    Permission to only allow admin users to access the view
    """
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"