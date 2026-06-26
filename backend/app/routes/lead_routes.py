"""
Lead Management routes (SRS Chapter 10) and Lead Qualification
Workflow (SRS Chapter 11).

GET    /api/leads
POST   /api/leads
GET    /api/leads/<id>
PUT    /api/leads/<id>
DELETE /api/leads/<id>
POST   /api/leads/<id>/convert
GET    /api/leads/<id>/activities
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.lead_schema import LeadCreateSchema, LeadUpdateSchema, LeadConvertSchema
from app.services import lead_service, activity_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

ALLOWED_SORT_FIELDS = ["created_at", "name", "status", "estimated_value", "updated_at"]


def _scope_for_role():
    """Agents only see leads assigned to them; admin/manager see everything."""
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@leads_bp.get("")
@permission_required("leads.read")
def list_leads():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)

    filters = {
        "status": request.args.get("status"),
        "source": request.args.get("source"),
        "qualification": request.args.get("qualification"),
        "assigned_to": request.args.get("assigned_to"),
        "search": request.args.get("search"),
    }
    leads, total = lead_service.list_leads(
        filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role()
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(leads), meta=meta)


@leads_bp.post("")
@permission_required("leads.create")
def create_lead():
    try:
        data = LeadCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    lead = lead_service.create_lead(data, g.current_user_id)
    return success_response(serialize_doc(lead), message="Lead created.", status_code=201)


@leads_bp.get("/<lead_id>")
@permission_required("leads.read")
def get_lead(lead_id):
    try:
        lead = lead_service.get_lead_by_id(lead_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(lead))


@leads_bp.put("/<lead_id>")
@permission_required("leads.update")
def update_lead(lead_id):
    try:
        data = LeadUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        lead = lead_service.update_lead(lead_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(lead), message="Lead updated.")


@leads_bp.delete("/<lead_id>")
@permission_required("leads.delete")
def delete_lead(lead_id):
    try:
        lead_service.delete_lead(lead_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Lead deleted.")


@leads_bp.post("/<lead_id>/convert")
@permission_required("leads.update")
def convert_lead(lead_id):
    try:
        data = LeadConvertSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        customer, deal = lead_service.convert_lead_to_customer(lead_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(
        {"customer": serialize_doc(customer), "deal": serialize_doc(deal)},
        message="Lead converted to customer.",
    )


@leads_bp.get("/<lead_id>/activities")
@permission_required("leads.read")
def get_lead_activities(lead_id):
    page, per_page, skip = get_pagination_params()
    activities, total = activity_service.list_activities_for_entity("lead", lead_id, skip, per_page)
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(activities), meta=meta)