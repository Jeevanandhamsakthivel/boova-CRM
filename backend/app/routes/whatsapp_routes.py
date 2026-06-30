from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.whatsapp_schema import WhatsAppSendSchema
from app.services import whatsapp_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

whatsapp_bp = Blueprint("whatsapp", __name__, url_prefix="/api/whatsapp")


@whatsapp_bp.post("/send")
@permission_required("whatsapp.send")
def send_message():
    try:
        data = WhatsAppSendSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    msg = whatsapp_service.send_message(data, g.current_user_id)
    return success_response(serialize_doc(msg), message="Message sent.", status_code=201)


@whatsapp_bp.get("/messages")
@permission_required("whatsapp.read")
def list_messages():
    page, per_page, skip = get_pagination_params()
    filters = {
        "customer_id": request.args.get("customer_id"),
        "lead_id": request.args.get("lead_id"),
        "direction": request.args.get("direction"),
    }
    messages, total = whatsapp_service.list_messages(filters, skip, per_page)
    return success_response(serialize_doc(messages), meta=build_pagination_meta(page, per_page, total))


@whatsapp_bp.post("/webhook")
def webhook_receive():
    """Inbound WhatsApp webhook endpoint."""
    body = request.get_json(force=True, silent=True) or {}
    from_number = body.get("from", body.get("From"))
    message_body = body.get("body", body.get("Body", ""))

    if from_number:
        whatsapp_service.log_inbound_message({"from": from_number, "message": message_body})
        whatsapp_service.create_lead_from_whatsapp(from_number, message_body)

    return success_response(message="Webhook received.")
