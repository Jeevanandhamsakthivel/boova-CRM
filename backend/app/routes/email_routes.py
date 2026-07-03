from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.email_schema import (
    EmailSendSchema,
    EmailTemplateCreateSchema,
    EmailTemplateUpdateSchema,
    InboundEmailSchema,
)
from app.services import email_service, smtp_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

email_bp = Blueprint("email", __name__, url_prefix="/api/email")


@email_bp.post("/send")
@permission_required("email.send")
def send_email():
    try:
        data = EmailSendSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    email = email_service.send_email(data, g.current_user_id)
    return success_response(serialize_doc(email), message="Email sent.", status_code=201)


@email_bp.get("/sent")
@permission_required("email.read")
def list_emails():
    page, per_page, skip = get_pagination_params()
    filters = {
        "customer_id": request.args.get("customer_id"),
        "lead_id": request.args.get("lead_id"),
        "direction": request.args.get("direction"),
        "q": request.args.get("q"),
    }
    emails, total = email_service.list_emails(filters, skip, per_page)
    return success_response(serialize_doc(emails), meta=build_pagination_meta(page, per_page, total))


@email_bp.get("/<email_id>")
@permission_required("email.read")
def get_email(email_id):
    try:
        email = email_service.get_email(email_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 404))
    return success_response(serialize_doc(email))


@email_bp.post("/webhook/inbound")
def webhook_inbound():
    """Public endpoint for receiving inbound emails from an external service
    (SendGrid Inbound Parse, Mailgun Routes, Postmark, etc.).

    Authentication is handled via a shared secret passed as ``X-Webhook-Secret``
    header or ``token`` query parameter.
    """
    token = request.args.get("token") or request.headers.get("X-Webhook-Secret", "")
    expected = email_service._get_webhook_secret()
    if expected and token != expected:
        return error_response("Unauthorized", 403)

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    try:
        parsed = InboundEmailSchema().load(data)
    except ValidationError as err:
        return error_response("Invalid payload.", 422, format_marshmallow_errors(err))

    entity_type, entity_id = email_service.find_related_entity(
        parsed.get("from"), parsed.get("body"), parsed.get("subject"),
    )
    if entity_type:
        parsed["customer_id" if entity_type == "customer" else "lead_id"] = entity_id

    email_id = email_service.log_inbound_email(parsed)
    return success_response({"id": email_id}, message="Inbound email received.", status_code=201)


@email_bp.post("/send-test")
@permission_required("email.send")
def send_test_email():
    """Send a test email to verify SMTP configuration (uses per-user settings if available)."""
    data = request.get_json(force=True, silent=True) or {}
    to_addr = data.get("to", getattr(g, "current_user_email", ""))
    if not to_addr:
        return error_response("Recipient email required.", 400)
    result = smtp_service.send(
        to_addrs=[to_addr],
        subject="Test email from PSM CRM",
        body="<h2>SMTP Configuration Test</h2><p>This email confirms your SMTP settings are working correctly.</p>",
        html=True,
        user_id=g.current_user_id,
    )
    if result["delivered"]:
        return success_response(result, message="Test email sent successfully.")
    return error_response(result.get("error", "SMTP delivery failed."), 502)


@email_bp.get("/config")
@permission_required("email.read")
def get_email_config():
    """Return SMTP configuration status (no secrets, checks per-user settings)."""
    user_id = g.current_user_id
    cfg = {
        "configured": smtp_service.is_configured(user_id),
        "host": email_service._get_smtp_config_value("SMTP_HOST", ""),
        "port": email_service._get_smtp_config_value("SMTP_PORT", 587),
        "from_name": email_service._get_smtp_config_value("SMTP_FROM_NAME", "PSM CRM"),
        "from_email": email_service._get_smtp_config_value("SMTP_FROM_EMAIL", "noreply@psmcrm.com"),
        "webhook_url": email_service._get_webhook_url(),
    }
    # Merge user-level overrides (without exposing password)
    user_cfg = smtp_service._get_user_smtp_settings(user_id)
    if user_cfg.get("host"):
        cfg["host"] = user_cfg["host"]
    if user_cfg.get("port"):
        cfg["port"] = user_cfg["port"]
    if user_cfg.get("from_name"):
        cfg["from_name"] = user_cfg["from_name"]
    if user_cfg.get("from_email"):
        cfg["from_email"] = user_cfg["from_email"]
    return success_response(cfg)


@email_bp.get("/templates")
@permission_required("email.read")
def list_templates():
    page, per_page, skip = get_pagination_params()
    filters = {"category": request.args.get("category")}
    templates, total = email_service.list_templates(filters, skip, per_page)
    return success_response(serialize_doc(templates), meta=build_pagination_meta(page, per_page, total))


@email_bp.post("/templates")
@permission_required("email.send")
def create_template():
    try:
        data = EmailTemplateCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    template = email_service.create_template(data, g.current_user_id)
    return success_response(serialize_doc(template), message="Template created.", status_code=201)


@email_bp.put("/templates/<template_id>")
@permission_required("email.send")
def update_template(template_id):
    try:
        data = EmailTemplateUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        template = email_service.update_template(template_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(template), message="Template updated.")


@email_bp.delete("/templates/<template_id>")
@permission_required("email.send")
def delete_template(template_id):
    try:
        email_service.delete_template(template_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Template deleted.")
