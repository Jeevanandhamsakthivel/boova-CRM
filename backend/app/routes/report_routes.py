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