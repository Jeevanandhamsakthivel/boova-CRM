"""
User management routes (SRS Chapter 8: Role Based Access Control).
Admin-only CRUD over the users collection.

GET    /api/users
GET    /api/users/<id>
PUT    /api/users/<id>
DELETE /api/users/<id>   (soft delete -> status=inactive)
"""
from flask import Blueprint, request
from marshmallow import ValidationError

from app.models.auth_schema import AdminUpdateUserSchema
from app.services import user_service
from app.services.audit_service import record_audit_log
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import admin_required

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

ALLOWED_SORT_FIELDS = ["created_at", "name", "email", "role", "status"]


@users_bp.get("")
@admin_required
def list_users():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)

    filters = {
        "role": request.args.get("role"),
        "status": request.args.get("status"),
        "search": request.args.get("search"),
    }
    users, total = user_service.list_users(filters, skip, per_page, sort_by, sort_direction)
    data = [user_service.public_user(u) for u in users]
    meta = build_pagination_meta(page, per_page, total)
    return success_response(data, meta=meta)


@users_bp.get("/<user_id>")
@admin_required
def get_user(user_id):
    try:
        user = user_service.get_user_by_id(user_id)
    except (AppError, ValueError) as e:
        status = getattr(e, "status_code", 400)
        return error_response(str(e), status)
    return success_response(user_service.public_user(user))


@users_bp.put("/<user_id>")
@admin_required
def update_user(user_id):
    try:
        data = AdminUpdateUserSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        user = user_service.admin_update_user(user_id, data)
    except AppError as e:
        return error_response(e.message, e.status_code)

    from flask import g
    record_audit_log(g.current_user_id, "update", "user", user_id, changes=data)
    return success_response(user_service.public_user(user), message="User updated.")


@users_bp.delete("/<user_id>")
@admin_required
def deactivate_user(user_id):
    try:
        user_service.deactivate_user(user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)

    from flask import g
    record_audit_log(g.current_user_id, "delete", "user", user_id)
    return success_response(message="User deactivated.")