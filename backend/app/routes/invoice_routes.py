from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.invoice_schema import InvoiceCreateSchema, InvoiceUpdateSchema, PaymentCreateSchema
from app.services import invoice_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

invoices_bp = Blueprint("invoices", __name__, url_prefix="/api/invoices")
payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")
ALLOWED_SORT_FIELDS = ["created_at", "invoice_number", "total", "status", "due_date", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@invoices_bp.get("")
@permission_required("invoices.read")
def list_invoices():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)
    filters = {
        "status": request.args.get("status"),
        "customer_id": request.args.get("customer_id"),
        "assigned_to": request.args.get("assigned_to"),
    }
    invoices, total = invoice_service.list_invoices(filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role())
    return success_response(serialize_doc(invoices), meta=build_pagination_meta(page, per_page, total))


@invoices_bp.post("")
@permission_required("invoices.create")
def create_invoice():
    try:
        data = InvoiceCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    invoice = invoice_service.create_invoice(data, g.current_user_id)
    return success_response(serialize_doc(invoice), message="Invoice created.", status_code=201)


@invoices_bp.get("/<invoice_id>")
@permission_required("invoices.read")
def get_invoice(invoice_id):
    try:
        invoice = invoice_service.get_invoice_by_id(invoice_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(invoice))


@invoices_bp.put("/<invoice_id>")
@permission_required("invoices.update")
def update_invoice(invoice_id):
    try:
        data = InvoiceUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        invoice = invoice_service.update_invoice(invoice_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(invoice), message="Invoice updated.")


@invoices_bp.delete("/<invoice_id>")
@permission_required("invoices.delete")
def delete_invoice(invoice_id):
    try:
        invoice_service.delete_invoice(invoice_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Invoice deleted.")


@payments_bp.post("")
@permission_required("invoices.update")
def record_payment():
    try:
        data = PaymentCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        payment = invoice_service.record_payment(data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(payment), message="Payment recorded.", status_code=201)
