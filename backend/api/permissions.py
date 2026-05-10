from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Only admin users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin()
        )


class IsJudge(BasePermission):
    """Only judge users."""
    message = "Judge access required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_judge()
        )


class IsAdminOrJudge(BasePermission):
    """Admin or judge users."""
    message = "Admin or judge access required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin() or request.user.is_judge())
        )


class IsStudent(BasePermission):
    """Only student users."""
    message = "Student access required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student()
        )


class IsAdminOrReadOnly(BasePermission):
    """Admin can do anything; others can only read."""
    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_admin()


class IsOwnerOrAdminOrJudge(BasePermission):
    """
    Object-level: owner (student) can read their own.
    Judges and admins can read all. Only admin can delete.
    """
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_admin():
            return True
        if user.is_judge() and request.method in SAFE_METHODS:
            return True
        # Students can only access their own submissions
        if hasattr(obj, "student"):
            return obj.student == user
        return False


class IsScoreOwnerOrAdmin(BasePermission):
    """Judge who created the score or admin can modify it."""
    message = "Only the scoring judge or admin can modify this score."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_admin():
            return True
        if request.method in SAFE_METHODS and user.is_judge():
            return True
        return obj.judge == user
