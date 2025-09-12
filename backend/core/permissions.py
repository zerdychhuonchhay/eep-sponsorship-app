# backend/core/permissions.py

from rest_framework import permissions

class HasModulePermission(permissions.BasePermission):
    """
    Custom permission to check if a user has permission for a specific module and action.
    This is the core of the backend RBAC enforcement.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Superusers bypass all permission checks
        if user.is_superuser:
            return True

        # Get the module name from the view it is protecting
        module_name = getattr(view, 'module_name', None)
        if not module_name:
            # Failsafe: if a developer forgets to add module_name to a view, deny access.
            return False

        # Determine the required action based on the request method
        action_map = {
            'GET': 'read',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        required_action = action_map.get(request.method, 'read')

        # Get the user's group (role)
        group = user.groups.first()
        if not group:
            return False # User has no role assigned

        # Retrieve the permissions from the RoleProfile linked to the group
        try:
            permissions_data = group.roleprofile.permissions
            module_permissions = permissions_data.get(module_name, {})
            return module_permissions.get(required_action, False)
        except AttributeError:
            # This happens if the RoleProfile doesn't exist for the group
            return False