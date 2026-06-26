"""
Decorators enforcing JWT authentication and RBAC permission checks,
per SRS Chapter 8 (RBAC) and Chapter 36 (JWT Authentication).
"""
from functools import wraps
from flask import g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from app.utils.errors import ForbiddenError, UnauthorizedError
from app.utils.rbac import role_has_permission, ROLE_ADMIN


def jwt_required_custom():
    """Verify JWT and populate flask.g with current user identity/claims."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            g.current_user_id = get_jwt_identity()
            g.current_user_role = claims.get("role")
            g.current_user_email = claims.get("email")
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def permission_required(permission_key):
    """Require the caller's role to hold the given permission."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required_custom()
        def wrapper(*args, **kwargs):
            role = getattr(g, "current_user_role", None)
            if not role or not role_has_permission(role, permission_key):
                raise ForbiddenError(
                    f"Role '{role}' is not permitted to perform this action."
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    @wraps(fn)
    @jwt_required_custom()
    def wrapper(*args, **kwargs):
        if getattr(g, "current_user_role", None) != ROLE_ADMIN:
            raise ForbiddenError("Admin access required.")
        return fn(*args, **kwargs)

    return wrapper


def is_admin_or_manager():
    return getattr(g, "current_user_role", None) in ("admin", "manager")