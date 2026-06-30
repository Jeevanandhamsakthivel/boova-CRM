from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.ticket_schema import TicketCreateSchema, TicketUpdateSchema, TicketReplySchema
from app.services import ticket_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")
ALLOWED_SORT_FIELDS = ["created_at", "subject", "status", "priority", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@tickets_bp.get("")
@permission_required("tickets.read")
def list_tickets():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)
    filters = {
        "status": request.args.get("status"),
        "priority": request.args.get("priority"),
        "customer_id": request.args.get("customer_id"),
        "assigned_to": request.args.get("assigned_to"),
        "category": request.args.get("category"),
    }
    tickets, total = ticket_service.list_tickets(filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role())
    return success_response(serialize_doc(tickets), meta=build_pagination_meta(page, per_page, total))


@tickets_bp.post("")
@permission_required("tickets.create")
def create_ticket():
    try:
        data = TicketCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    ticket = ticket_service.create_ticket(data, g.current_user_id)
    return success_response(serialize_doc(ticket), message="Ticket created.", status_code=201)


@tickets_bp.get("/<ticket_id>")
@permission_required("tickets.read")
def get_ticket(ticket_id):
    try:
        ticket = ticket_service.get_ticket_by_id(ticket_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(ticket))


@tickets_bp.put("/<ticket_id>")
@permission_required("tickets.update")
def update_ticket(ticket_id):
    try:
        data = TicketUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        ticket = ticket_service.update_ticket(ticket_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(ticket), message="Ticket updated.")


@tickets_bp.delete("/<ticket_id>")
@permission_required("tickets.delete")
def delete_ticket(ticket_id):
    try:
        ticket_service.delete_ticket(ticket_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Ticket deleted.")


@tickets_bp.post("/<ticket_id>/reply")
@permission_required("tickets.update")
def add_reply(ticket_id):
    try:
        data = TicketReplySchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        reply = ticket_service.add_reply(ticket_id, data["body"], data.get("is_internal", False), g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(reply), message="Reply added.")
