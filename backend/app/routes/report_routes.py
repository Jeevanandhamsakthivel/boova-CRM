"""
Reports & Analytics routes (SRS Chapter 19).

GET /api/reports/leads-by-status
GET /api/reports/leads-by-source
GET /api/reports/deals-by-stage
GET /api/reports/sales-performance
GET /api/reports/tasks-completion
"""
from flask import Blueprint, request
from dateutil import parser as date_parser

from app.services import report_service
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.get("/leads-by-status")
@permission_required("reports.read")
def leads_by_status():
    return success_response(serialize_doc(report_service.leads_by_status_report()))


@reports_bp.get("/leads-by-source")
@permission_required("reports.read")
def leads_by_source():
    return success_response(serialize_doc(report_service.leads_by_source_report()))


@reports_bp.get("/deals-by-stage")
@permission_required("reports.read")
def deals_by_stage():
    return success_response(serialize_doc(report_service.deals_by_stage_report()))


@reports_bp.get("/sales-performance")
@permission_required("reports.read")
def sales_performance():
    start_date = None
    end_date = None
    try:
        if request.args.get("start_date"):
            start_date = date_parser.isoparse(request.args["start_date"])
        if request.args.get("end_date"):
            end_date = date_parser.isoparse(request.args["end_date"])
    except (ValueError, OverflowError):
        return error_response("Invalid start_date or end_date format. Use ISO 8601.", 422)

    return success_response(
        serialize_doc(report_service.sales_performance_report(start_date, end_date))
    )


@reports_bp.get("/tasks-completion")
@permission_required("reports.read")
def tasks_completion():
    return success_response(serialize_doc(report_service.tasks_completion_report()))


@reports_bp.post("/custom")
@permission_required("reports.read")
def custom_report():
    """Custom report builder (8.1) — build a report dynamically by specifying collection, group, and metrics."""
    body = request.get_json(force=True, silent=True) or {}
    collection = body.get("collection", "deals")
    group_by = body.get("group_by")
    metrics = body.get("metrics", [])
    filters = body.get("filters", {})

    if not group_by:
        return error_response("group_by is required.", 422)

    try:
        result = report_service.custom_report(collection, group_by, metrics, filters)
    except (ValueError, KeyError) as e:
        return error_response(str(e), 422)

    return success_response(serialize_doc(result))


@reports_bp.get("/forecast-accuracy")
@permission_required("reports.read")
def forecast_accuracy():
    """Forecast accuracy tracking (8.4)."""
    return success_response(serialize_doc(report_service.forecast_accuracy_report()))


@reports_bp.get("/drill-down/<collection>")
@permission_required("reports.read")
def drill_down(collection):
    """One-click drill-down from a chart (8.3) to the underlying records."""
    from app.utils.pagination import get_pagination_params, build_pagination_meta
    from app.db import get_db

    page, per_page, skip = get_pagination_params()
    db = get_db()

    filters = {}
    for key in request.args:
        if key not in ("page", "per_page"):
            filters[key] = request.args[key]

    query = {}
    for key, value in filters.items():
        if value:
            query[key] = value

    allowed = ["leads", "customers", "deals", "tasks", "followups", "invoices", "tickets"]
    if collection not in allowed:
        return error_response(f"Collection '{collection}' not available for drill-down.", 400)

    total = db[collection].count_documents(query)
    cursor = db[collection].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    records = list(cursor)
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(records), meta=meta)