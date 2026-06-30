from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.company_schema import CompanyCreateSchema, CompanyUpdateSchema
from app.services import company_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")
ALLOWED_SORT_FIELDS = ["created_at", "name", "status", "annual_revenue", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@companies_bp.get("")
@permission_required("companies.read")
def list_companies():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)
    filters = {
        "status": request.args.get("status"),
        "industry": request.args.get("industry"),
        "assigned_to": request.args.get("assigned_to"),
        "search": request.args.get("search"),
    }
    companies, total = company_service.list_companies(filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role())
    return success_response(serialize_doc(companies), meta=build_pagination_meta(page, per_page, total))


@companies_bp.post("")
@permission_required("companies.create")
def create_company():
    try:
        data = CompanyCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        company = company_service.create_company(data, g.current_user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(serialize_doc(company), message="Company created.", status_code=201)


@companies_bp.get("/<company_id>")
@permission_required("companies.read")
def get_company(company_id):
    try:
        company = company_service.get_company_by_id(company_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(company))


@companies_bp.put("/<company_id>")
@permission_required("companies.update")
def update_company(company_id):
    try:
        data = CompanyUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        company = company_service.update_company(company_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(company), message="Company updated.")


@companies_bp.delete("/<company_id>")
@permission_required("companies.delete")
def delete_company(company_id):
    try:
        company_service.delete_company(company_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Company deleted.")
