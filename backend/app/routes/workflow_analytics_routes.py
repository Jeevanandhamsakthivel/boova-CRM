from flask import Blueprint, request
from app.services import workflow_analytics_service
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required
from app.utils.errors import AppError

workflow_analytics_bp = Blueprint("workflow_analytics", __name__, url_prefix="/api/workflow-analytics")


@workflow_analytics_bp.get("/overview")
@permission_required("workflows.read")
def get_overview():
    timeframe = request.args.get("timeframe", 30, type=int)
    try:
        analytics = workflow_analytics_service.get_analytics_overview(timeframe_days=timeframe)
        return success_response(analytics)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))


@workflow_analytics_bp.get("/workflow/<workflow_id>")
@permission_required("workflows.read")
def get_workflow_performance(workflow_id):
    timeframe = request.args.get("timeframe", 30, type=int)
    try:
        perf = workflow_analytics_service.get_workflow_performance(workflow_id, timeframe_days=timeframe)
        return success_response(perf)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
