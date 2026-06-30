"""
Customer Management routes (SRS Chapter 12).

GET    /api/customers
POST   /api/customers
GET    /api/customers/<id>
PUT    /api/customers/<id>
PATCH  /api/customers/<id>
DELETE /api/customers/<id>
GET    /api/customers/<id>/activities
GET    /api/customers/<id>/deals
GET    /api/customers/<id>/workspace
GET    /api/customers/<id>/files
POST   /api/customers/<id>/files
DELETE /api/customers/<id>/files/<file_id>
"""
import os
from flask import Blueprint, request, g, current_app, send_file
from marshmallow import ValidationError

from app.models.customer_schema import CustomerCreateSchema, CustomerUpdateSchema
from app.services import customer_service, activity_service, deal_service, workspace_service, file_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError
from app.utils.errors import format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required


def _upload_folder():
    return current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))

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


@customers_bp.patch("/<customer_id>")
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


# ── Workspace ────────────────────────────────────────────────

@customers_bp.get("/<customer_id>/workspace")
@permission_required("customers.read")
def get_workspace(customer_id):
    try:
        data = workspace_service.get_workspace_data(customer_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response({
        "customer":           serialize_doc(data["customer"]),
        "recent_activities":  serialize_doc(data["recent_activities"]),
        "summary":            data["summary"],
    })


# ── Files ────────────────────────────────────────────────────

@customers_bp.get("/<customer_id>/files")
@permission_required("customers.read")
def list_files(customer_id):
    files = file_service.list_files(customer_id)
    return success_response(serialize_doc(files))


@customers_bp.post("/<customer_id>/files")
@permission_required("customers.update")
def upload_file(customer_id):
    if "file" not in request.files:
        return error_response("No file provided.", 400)
    uploaded = request.files["file"]
    if not uploaded.filename:
        return error_response("No file selected.", 400)
    try:
        doc = file_service.save_file(customer_id, uploaded, g.current_user_id, _upload_folder())
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(serialize_doc(doc), message="File uploaded.", status_code=201)


@customers_bp.delete("/<customer_id>/files/<file_id>")
@permission_required("customers.update")
def delete_file(customer_id, file_id):
    try:
        file_service.delete_file(file_id, g.current_user_id, _upload_folder())
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(message="File deleted.")


# ── File download (no customer scope needed, uses storage_key) ──

@customers_bp.get("/files/<path:storage_key>")
@permission_required("customers.read")
def download_file(storage_key):
    path = file_service.get_file_path(storage_key, _upload_folder())
    if not os.path.exists(path):
        return error_response("File not found.", 404)
    return send_file(path, as_attachment=False)
