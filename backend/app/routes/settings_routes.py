"""
Validation schemas and endpoints for Settings Module (SRS Chapter 20).
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.settings_schema import SettingUpsertSchema
from app.services import settings_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import admin_required, jwt_required_custom

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_bp.get("")
@jwt_required_custom()
def list_settings():
    scope = request.args.get("scope")
    scope_id = request.args.get("scope_id")
    settings = settings_service.list_settings(scope, scope_id)
    return success_response(serialize_doc(settings))


@settings_bp.post("")
@jwt_required_custom()
def upsert_setting():
    try:
        data = SettingUpsertSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    # Non-admin users can only manage their own user-scoped settings
    if g.current_user_role != "admin":
        if data.get("scope") != "user":
            return error_response("Only admins can manage global settings.", 403)
        if data.get("scope_id") and data["scope_id"] != g.current_user_id:
            return error_response("You can only modify your own settings.", 403)
        data["scope_id"] = g.current_user_id

    setting = settings_service.upsert_setting(data, g.current_user_id)
    return success_response(serialize_doc(setting), message="Setting updated.")


@settings_bp.delete("/<key>")
@jwt_required_custom()
def delete_setting(key):
    scope = request.args.get("scope", "global")
    scope_id = request.args.get("scope_id")

    if g.current_user_role != "admin":
        if scope != "user":
            return error_response("Only admins can delete global settings.", 403)
        if scope_id and scope_id != g.current_user_id:
            return error_response("You can only delete your own settings.", 403)

    try:
        settings_service.delete_setting(key, scope, scope_id)
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(message="Setting deleted.")
