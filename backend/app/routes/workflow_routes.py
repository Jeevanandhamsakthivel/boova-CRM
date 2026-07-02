from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.workflow_schema import WorkflowCreateSchema, WorkflowUpdateSchema
from app.services import workflow_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required

workflows_bp = Blueprint("workflows", __name__, url_prefix="/api/workflows")


@workflows_bp.get("")
@permission_required("workflows.read")
def list_workflows():
    page, per_page, skip = get_pagination_params()
    filters = {
        "status": request.args.get("status"),
        "category": request.args.get("category"),
        "entity_type": request.args.get("entity_type"),
        "search": request.args.get("search"),
    }
    workflows, total = workflow_service.list_workflows(filters, skip, per_page)
    return success_response(serialize_doc(workflows), meta=build_pagination_meta(page, per_page, total))


@workflows_bp.post("")
@permission_required("workflows.create")
def create_workflow():
    try:
        data = WorkflowCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    workflow = workflow_service.create_workflow(data, g.current_user_id)
    return success_response(serialize_doc(workflow), message="Workflow created.", status_code=201)


@workflows_bp.get("/stats")
@permission_required("workflows.read")
def get_workflow_stats():
    stats = workflow_service.get_workflow_stats()
    return success_response(stats)


@workflows_bp.get("/entities")
@permission_required("workflows.read")
def get_entity_references():
    entity_type = request.args.get("entity_type", "lead")
    search = request.args.get("search")
    page, per_page, skip = get_pagination_params()
    entities, total = workflow_service.get_workflow_entity_references(entity_type, search, skip, per_page)
    return success_response(serialize_doc(entities), meta=build_pagination_meta(page, per_page, total))


@workflows_bp.get("/<workflow_id>")
@permission_required("workflows.read")
def get_workflow(workflow_id):
    try:
        workflow = workflow_service.get_workflow_by_id(workflow_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow))


@workflows_bp.put("/<workflow_id>")
@permission_required("workflows.update")
def update_workflow(workflow_id):
    try:
        data = WorkflowUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        workflow = workflow_service.update_workflow(workflow_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow), message="Workflow updated.")


@workflows_bp.delete("/<workflow_id>")
@permission_required("workflows.delete")
def delete_workflow(workflow_id):
    try:
        workflow_service.delete_workflow(workflow_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Workflow deleted.")


@workflows_bp.post("/<workflow_id>/duplicate")
@permission_required("workflows.create")
def duplicate_workflow(workflow_id):
    try:
        workflow = workflow_service.duplicate_workflow(workflow_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow), message="Workflow duplicated.", status_code=201)


@workflows_bp.post("/<workflow_id>/activate")
@permission_required("workflows.update")
def activate_workflow(workflow_id):
    try:
        workflow = workflow_service.activate_workflow(workflow_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow), message="Workflow activated.")


@workflows_bp.post("/<workflow_id>/deactivate")
@permission_required("workflows.update")
def deactivate_workflow(workflow_id):
    try:
        workflow = workflow_service.deactivate_workflow(workflow_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow), message="Workflow deactivated.")
