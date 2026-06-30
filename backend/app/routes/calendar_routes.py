from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.calendar_schema import MeetingCreateSchema, MeetingUpdateSchema
from app.services import calendar_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

calendar_bp = Blueprint("calendar", __name__, url_prefix="/api/calendar")


@calendar_bp.get("/meetings")
@permission_required("calendar.read")
def list_meetings():
    page, per_page, skip = get_pagination_params()
    scope_user_id = g.current_user_id if g.current_user_role == "agent" else None
    filters = {
        "status": request.args.get("status"),
        "customer_id": request.args.get("customer_id"),
        "lead_id": request.args.get("lead_id"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
    }
    meetings, total = calendar_service.list_meetings(filters, skip, per_page, scope_user_id=scope_user_id)
    return success_response(serialize_doc(meetings), meta=build_pagination_meta(page, per_page, total))


@calendar_bp.post("/meetings")
@permission_required("calendar.create")
def create_meeting():
    try:
        data = MeetingCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    meeting = calendar_service.create_meeting(data, g.current_user_id)
    return success_response(serialize_doc(meeting), message="Meeting scheduled.", status_code=201)


@calendar_bp.get("/meetings/<meeting_id>")
@permission_required("calendar.read")
def get_meeting(meeting_id):
    try:
        meeting = calendar_service.get_meeting_by_id(meeting_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(meeting))


@calendar_bp.put("/meetings/<meeting_id>")
@permission_required("calendar.update")
def update_meeting(meeting_id):
    try:
        data = MeetingUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        meeting = calendar_service.update_meeting(meeting_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(meeting), message="Meeting updated.")


@calendar_bp.delete("/meetings/<meeting_id>")
@permission_required("calendar.delete")
def delete_meeting(meeting_id):
    try:
        calendar_service.delete_meeting(meeting_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Meeting cancelled.")
