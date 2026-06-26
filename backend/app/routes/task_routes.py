"""
Task Management routes (SRS Chapter 14).

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/<id>
PUT    /api/tasks/<id>
DELETE /api/tasks/<id>
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.task_schema import TaskCreateSchema, TaskUpdateSchema
from app.services import task_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

ALLOWED_SORT_FIELDS = ["created_at", "due_date", "priority", "status", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@tasks_bp.get("")
@permission_required("tasks.read")
def list_tasks():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS, default_field="due_date", default_order="asc")

    filters = {
        "status": request.args.get("status"),
        "priority": request.args.get("priority"),
        "assigned_to": request.args.get("assigned_to"),
        "related_to_id": request.args.get("related_to_id"),
        "search": request.args.get("search"),
    }
    tasks, total = task_service.list_tasks(
        filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role()
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(tasks), meta=meta)


@tasks_bp.post("")
@permission_required("tasks.create")
def create_task():
    try:
        data = TaskCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    task = task_service.create_task(data, g.current_user_id)
    return success_response(serialize_doc(task), message="Task created.", status_code=201)


@tasks_bp.get("/<task_id>")
@permission_required("tasks.read")
def get_task(task_id):
    try:
        task = task_service.get_task_by_id(task_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(task))


@tasks_bp.put("/<task_id>")
@permission_required("tasks.update")
def update_task(task_id):
    try:
        data = TaskUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        task = task_service.update_task(task_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(task), message="Task updated.")


@tasks_bp.delete("/<task_id>")
@permission_required("tasks.delete")
def delete_task(task_id):
    try:
        task_service.delete_task(task_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Task deleted.")