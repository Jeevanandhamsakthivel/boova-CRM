"""
Notification System routes (SRS Chapter 18).

GET    /api/notifications
PUT    /api/notifications/<id>/read
POST   /api/notifications/mark-all-read
DELETE /api/notifications/<id>
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.notification_schema import NotificationMarkReadSchema
from app.services import notification_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import jwt_required_custom

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.get("")
@jwt_required_custom()
def list_notifications():
    page, per_page, skip = get_pagination_params()
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    notifications, total, unread_count = notification_service.list_notifications_for_user(
        g.current_user_id, skip, per_page, unread_only=unread_only
    )
    meta = build_pagination_meta(page, per_page, total)
    meta["unread_count"] = unread_count
    return success_response(serialize_doc(notifications), meta=meta)


@notifications_bp.put("/<notification_id>/read")
@jwt_required_custom()
def mark_read(notification_id):
    try:
        data = NotificationMarkReadSchema().load(request.get_json(force=True, silent=True) or {"is_read": True})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        notification = notification_service.mark_notification_read(
            notification_id, g.current_user_id, data["is_read"]
        )
    except AppError as e:
        return error_response(e.message, e.status_code)

    return success_response(serialize_doc(notification), message="Notification updated.")


@notifications_bp.post("/mark-all-read")
@jwt_required_custom()
def mark_all_read():
    notification_service.mark_all_read(g.current_user_id)
    return success_response(message="All notifications marked as read.")


@notifications_bp.delete("/<notification_id>")
@jwt_required_custom()
def delete_notification(notification_id):
    try:
        notification_service.delete_notification(notification_id, g.current_user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(message="Notification deleted.")