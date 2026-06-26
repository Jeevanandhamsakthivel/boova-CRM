"""
Follow-Up Management routes (SRS Chapter 13).

GET    /api/followups
POST   /api/followups
GET    /api/followups/<id>
PUT    /api/followups/<id>
DELETE /api/followups/<id>
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.followup_schema import FollowUpCreateSchema, FollowUpUpdateSchema
from app.services import followup_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

followups_bp = Blueprint("followups", __name__, url_prefix="/api/followups")

ALLOWED_SORT_FIELDS = ["created_at", "due_date", "status", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@followups_bp.get("")
@permission_required("followups.read")
def list_followups():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS, default_field="due_date", default_order="asc")

    filters = {
        "status": request.args.get("status"),
        "type": request.args.get("type"),
        "assigned_to": request.args.get("assigned_to"),
        "related_to_id": request.args.get("related_to_id"),
    }
    followups, total = followup_service.list_followups(
        filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role()
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(followups), meta=meta)


@followups_bp.post("")
@permission_required("followups.create")
def create_followup():
    try:
        data = FollowUpCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    followup = followup_service.create_followup(data, g.current_user_id)
    return success_response(serialize_doc(followup), message="Follow-up created.", status_code=201)


@followups_bp.get("/<followup_id>")
@permission_required("followups.read")
def get_followup(followup_id):
    try:
        followup = followup_service.get_followup_by_id(followup_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(followup))


@followups_bp.put("/<followup_id>")
@permission_required("followups.update")
def update_followup(followup_id):
    try:
        data = FollowUpUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        followup = followup_service.update_followup(followup_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(followup), message="Follow-up updated.")


@followups_bp.delete("/<followup_id>")
@permission_required("followups.delete")
def delete_followup(followup_id):
    try:
        followup_service.delete_followup(followup_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Follow-up deleted.")