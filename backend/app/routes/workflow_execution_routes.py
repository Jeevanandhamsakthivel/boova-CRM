from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.workflow_execution_schema import WorkflowExecutionCreateSchema, WorkflowExecutionUpdateSchema
from app.services import workflow_execution_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

workflow_executions_bp = Blueprint("workflow_executions", __name__, url_prefix="/api/workflow-executions")


@workflow_executions_bp.get("")
@permission_required("workflows.read")
def list_executions():
    page, per_page, skip = get_pagination_params()
    filters = {
        "status": request.args.get("status"),
        "workflow_id": request.args.get("workflow_id"),
        "entity_type": request.args.get("entity_type"),
        "entity_id": request.args.get("entity_id"),
        "trigger_type": request.args.get("trigger_type"),
    }
    executions, total = workflow_execution_service.list_executions(filters, skip, per_page)
    return success_response(serialize_doc(executions), meta=build_pagination_meta(page, per_page, total))


@workflow_executions_bp.post("")
@permission_required("workflows.create")
def create_execution():
    try:
        data = WorkflowExecutionCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        execution = workflow_execution_service.create_execution(data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Execution created.", status_code=201)


@workflow_executions_bp.get("/stats")
@permission_required("workflows.read")
def get_execution_stats():
    timeframe = request.args.get("timeframe", 30, type=int)
    stats = workflow_execution_service.get_execution_stats(timeframe_days=timeframe)
    return success_response(serialize_doc(stats))


@workflow_executions_bp.get("/<execution_id>")
@permission_required("workflows.read")
def get_execution(execution_id):
    try:
        execution = workflow_execution_service.get_execution_by_id(execution_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution))


@workflow_executions_bp.post("/<execution_id>/start")
@permission_required("workflows.update")
def start_execution(execution_id):
    try:
        execution = workflow_execution_service.start_execution(execution_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Execution started.")


@workflow_executions_bp.post("/<execution_id>/complete")
@permission_required("workflows.update")
def complete_execution(execution_id):
    body = request.get_json(force=True, silent=True) or {}
    try:
        execution = workflow_execution_service.complete_execution(execution_id, body.get("output_data"))
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Execution completed.")


@workflow_executions_bp.post("/<execution_id>/fail")
@permission_required("workflows.update")
def fail_execution(execution_id):
    body = request.get_json(force=True, silent=True) or {}
    try:
        execution = workflow_execution_service.fail_execution(execution_id, body.get("error", "Unknown error"))
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Execution marked as failed.")


@workflow_executions_bp.post("/<execution_id>/cancel")
@permission_required("workflows.update")
def cancel_execution(execution_id):
    try:
        execution = workflow_execution_service.cancel_execution(execution_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Execution cancelled.")


@workflow_executions_bp.post("/<execution_id>/node-log")
@permission_required("workflows.update")
def add_node_log(execution_id):
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("node_id") or not body.get("node_type") or not body.get("status"):
        return error_response("node_id, node_type, and status are required.", 422)
    try:
        execution = workflow_execution_service.update_node_log(execution_id, body)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(execution), message="Node log updated.")
