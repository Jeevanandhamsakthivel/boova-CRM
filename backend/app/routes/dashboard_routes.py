"""
Dashboard Module routes (SRS Chapter 9).

GET /api/dashboard/summary
"""
from flask import Blueprint, g

from app.services import report_service
from app.utils.responses import success_response
from app.middlewares.auth_middleware import jwt_required_custom

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/summary")
@jwt_required_custom()
def get_summary():
    scope_user_id = g.current_user_id if g.current_user_role == "agent" else None
    summary = report_service.dashboard_summary(scope_user_id=scope_user_id)
    return success_response(summary)