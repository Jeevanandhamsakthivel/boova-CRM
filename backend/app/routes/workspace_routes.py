"""
Unified Customer Workspace routes.

GET   /api/customers/<customer_id>/workspace   — aggregated workspace data
PATCH /api/customers/<customer_id>             — single-field inline edit (alias for PUT)
"""
from flask import Blueprint, g
from marshmallow import ValidationError

from app.services import workspace_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required

workspace_bp = Blueprint("workspace", __name__, url_prefix="/api/customers")


@workspace_bp.get("/<customer_id>/workspace")
@permission_required("customers.read")
def get_workspace(customer_id):
    try:
        data = workspace_service.get_workspace_data(customer_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response({
        "customer": serialize_doc(data["customer"]),
        "recent_activities": serialize_doc(data["recent_activities"]),
        "summary": data["summary"],
    })
