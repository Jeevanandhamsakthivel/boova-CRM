from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.workflow_template_schema import WorkflowTemplateCreateSchema, WorkflowTemplateUpdateSchema
from app.services import workflow_template_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import permission_required, admin_required

workflow_templates_bp = Blueprint("workflow_templates", __name__, url_prefix="/api/workflow-templates")


@workflow_templates_bp.get("")
@permission_required("workflows.read")
def list_templates():
    page, per_page, skip = get_pagination_params()
    filters = {
        "category": request.args.get("category"),
        "entity_type": request.args.get("entity_type"),
        "industry": request.args.get("industry"),
        "search": request.args.get("search"),
    }
    templates, total = workflow_template_service.list_templates(filters, skip, per_page)
    return success_response(serialize_doc(templates), meta=build_pagination_meta(page, per_page, total))


@workflow_templates_bp.post("")
@permission_required("workflows.create")
def create_template():
    try:
        data = WorkflowTemplateCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    template = workflow_template_service.create_template(data, g.current_user_id)
    return success_response(serialize_doc(template), message="Template created.", status_code=201)


@workflow_templates_bp.get("/seed")
@admin_required
def seed_templates():
    workflow_template_service.seed_built_in_templates()
    return success_response(message="Built-in templates seeded.")


@workflow_templates_bp.get("/<template_id>")
@permission_required("workflows.read")
def get_template(template_id):
    try:
        template = workflow_template_service.get_template_by_id(template_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(template))


@workflow_templates_bp.put("/<template_id>")
@permission_required("workflows.update")
def update_template(template_id):
    try:
        data = WorkflowTemplateUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        template = workflow_template_service.update_template(template_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(template), message="Template updated.")


@workflow_templates_bp.delete("/<template_id>")
@permission_required("workflows.delete")
def delete_template(template_id):
    try:
        workflow_template_service.delete_template(template_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Template deleted.")


@workflow_templates_bp.post("/<template_id>/apply")
@permission_required("workflows.create")
def apply_template(template_id):
    try:
        workflow = workflow_template_service.apply_template(template_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(workflow), message="Template applied.", status_code=201)
