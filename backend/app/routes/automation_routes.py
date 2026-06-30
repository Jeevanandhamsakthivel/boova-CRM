from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.automation_schema import AutomationCreateSchema, AutomationUpdateSchema
from app.services import automation_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

automation_bp = Blueprint("automation", __name__, url_prefix="/api/automation")


@automation_bp.get("")
@permission_required("automation.read")
def list_automations():
    page, per_page, skip = get_pagination_params()
    filters = {
        "status": request.args.get("status"),
        "object_type": request.args.get("object_type"),
    }
    automations, total = automation_service.list_automations(filters, skip, per_page)
    return success_response(serialize_doc(automations), meta=build_pagination_meta(page, per_page, total))


@automation_bp.post("")
@permission_required("automation.create")
def create_automation():
    try:
        data = AutomationCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    automation = automation_service.create_automation(data, g.current_user_id)
    return success_response(serialize_doc(automation), message="Automation created.", status_code=201)


@automation_bp.get("/<automation_id>")
@permission_required("automation.read")
def get_automation(automation_id):
    try:
        automation = automation_service.get_automation_by_id(automation_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(automation))


@automation_bp.put("/<automation_id>")
@permission_required("automation.update")
def update_automation(automation_id):
    try:
        data = AutomationUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        automation = automation_service.update_automation(automation_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(automation), message="Automation updated.")


@automation_bp.delete("/<automation_id>")
@permission_required("automation.delete")
def delete_automation(automation_id):
    try:
        automation_service.delete_automation(automation_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Automation deleted.")


@automation_bp.post("/evaluate")
@permission_required("automation.read")
def evaluate_trigger():
    body = request.get_json(force=True, silent=True) or {}
    event_type = body.get("event_type")
    event_data = body.get("event_data", {})
    if not event_type:
        return error_response("event_type is required.", 422)
    results = automation_service.evaluate_trigger(event_type, event_data)
    return success_response(serialize_doc(results))
