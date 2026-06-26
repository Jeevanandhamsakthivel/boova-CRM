"""
Endpoints for Audit Logs Module (SRS Chapter 37).
"""
from flask import Blueprint, request
from app.services import audit_service
from app.utils.responses import success_response
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import admin_required

audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit")


@audit_bp.get("")
@admin_required
def list_logs():
    page, per_page, skip = get_pagination_params()
    filters = {
        "user_id": request.args.get("user_id"),
        "entity_type": request.args.get("entity_type"),
        "entity_id": request.args.get("entity_id"),
        "action": request.args.get("action"),
    }
    logs, total = audit_service.list_audit_logs(filters, skip, per_page)
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(logs), meta=meta)
