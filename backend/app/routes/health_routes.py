"""
Health check endpoint for uptime monitoring / load balancer probes
(SRS Chapter 44: Monitoring).
"""
from flask import Blueprint, current_app

from app.utils.responses import success_response

health_bp = Blueprint("health", __name__, url_prefix="/api/health")


@health_bp.get("")
def health_check():
    db = current_app.extensions.get("db")
    db_status = "unknown"
    try:
        if db is not None:
            db.command("ping")
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return success_response({"status": "ok", "database": db_status}, message="PSM CRM API is running.")