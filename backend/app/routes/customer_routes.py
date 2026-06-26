"""
Customer Management routes (SRS Chapter 12).

GET    /api/customers
POST   /api/customers
GET    /api/customers/<id>
PUT    /api/customers/<id>
DELETE /api/customers/<id>
GET    /api/customers/<id>/activities
GET    /api/customers/<id>/deals
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.customer_schema import CustomerCreateSchema, CustomerUpdateSchema
from app.services import customer_service, activity_service, deal_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError
from app.utils.errors import format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")

ALLOWED_SORT_FIELDS = ["created_at", "name", "status", "lifetime_value", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@customers_bp.get("")
@permission_required("customers.read")
def list_customers():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)

    filters = {
        "status": request.args.get("status"),
        "assigned_to": request.args.get("assigned_to"),
        "search": request.args.get("search"),
    }
    customers, total = customer_service.list_customers(
        filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role()
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(customers), meta=meta)


@customers_bp.post("")
@permission_required("customers.create")
def create_customer():
    try:
        data = CustomerCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        customer = customer_service.create_customer(data, g.current_user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)

    return success_response(serialize_doc(customer), message="Customer created.", status_code=201)


@customers_bp.get("/<customer_id>")
@permission_required("customers.read")
def get_customer(customer_id):
    try:
        customer = customer_service.get_customer_by_id(customer_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(customer))


@customers_bp.put("/<customer_id>")
@permission_required("customers.update")
def update_customer(customer_id):
    try:
        data = CustomerUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        customer = customer_service.update_customer(customer_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(customer), message="Customer updated.")


@customers_bp.delete("/<customer_id>")
@permission_required("customers.delete")
def delete_customer(customer_id):
    try:
        customer_service.delete_customer(customer_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Customer deleted.")


@customers_bp.get("/<customer_id>/activities")
@permission_required("customers.read")
def get_customer_activities(customer_id):
    page, per_page, skip = get_pagination_params()
    activities, total = activity_service.list_activities_for_entity(
        "customer", customer_id, skip, per_page
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(activities), meta=meta)


@customers_bp.get("/<customer_id>/deals")
@permission_required("customers.read")
def get_customer_deals(customer_id):
    page, per_page, skip = get_pagination_params()
    deals, total = deal_service.list_deals(
        {"customer_id": customer_id}, skip, per_page, "created_at", -1
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(deals), meta=meta)