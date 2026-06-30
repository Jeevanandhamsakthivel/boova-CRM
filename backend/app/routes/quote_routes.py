from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.quote_schema import QuoteCreateSchema, QuoteUpdateSchema
from app.services import quote_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

quotes_bp = Blueprint("quotes", __name__, url_prefix="/api/quotes")
ALLOWED_SORT_FIELDS = ["created_at", "title", "total", "status", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@quotes_bp.get("")
@permission_required("quotes.read")
def list_quotes():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)
    filters = {
        "status": request.args.get("status"),
        "customer_id": request.args.get("customer_id"),
        "assigned_to": request.args.get("assigned_to"),
    }
    quotes, total = quote_service.list_quotes(filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role())
    return success_response(serialize_doc(quotes), meta=build_pagination_meta(page, per_page, total))


@quotes_bp.post("")
@permission_required("quotes.create")
def create_quote():
    try:
        data = QuoteCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    quote = quote_service.create_quote(data, g.current_user_id)
    return success_response(serialize_doc(quote), message="Quote created.", status_code=201)


@quotes_bp.get("/<quote_id>")
@permission_required("quotes.read")
def get_quote(quote_id):
    try:
        quote = quote_service.get_quote_by_id(quote_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(quote))


@quotes_bp.put("/<quote_id>")
@permission_required("quotes.update")
def update_quote(quote_id):
    try:
        data = QuoteUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        quote = quote_service.update_quote(quote_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(quote), message="Quote updated.")


@quotes_bp.delete("/<quote_id>")
@permission_required("quotes.delete")
def delete_quote(quote_id):
    try:
        quote_service.delete_quote(quote_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Quote deleted.")
