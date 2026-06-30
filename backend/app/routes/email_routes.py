from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.email_schema import EmailSendSchema, EmailTemplateCreateSchema, EmailTemplateUpdateSchema
from app.services import email_service
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
    }
    emails, total = email_service.list_emails(filters, skip, per_page)
    return success_response(serialize_doc(emails), meta=build_pagination_meta(page, per_page, total))


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
