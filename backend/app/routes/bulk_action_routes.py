from flask import Blueprint, request, g
from app.services import bulk_action_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required
from marshmallow import Schema, fields, validate

bulk_bp = Blueprint("bulk", __name__, url_prefix="/api/bulk")


class BulkActionSchema(Schema):
    collection = fields.String(required=True)
    record_ids = fields.List(fields.String(), required=True, validate=validate.Length(min=1))
    action = fields.String(required=True)
    data = fields.Dict(load_default=dict)
    tags = fields.List(fields.String(), load_default=list)


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


@bulk_bp.post("")
@permission_required("bulk.actions")
def bulk_action():
    body = request.get_json(force=True, silent=True) or {}
    try:
        schema = BulkActionSchema().load(body)
    except Exception as e:
        return error_response("Validation failed.", 422, errors=[str(e)])

    collection = schema["collection"]
    record_ids = schema["record_ids"]
    action = schema["action"]
    data = schema.get("data", {})
    tags = schema.get("tags", [])
    scope = _scope_for_role()

    try:
        if action == "update":
            count = bulk_action_service.bulk_update(collection, record_ids, data, g.current_user_id, scope)
        elif action == "delete":
            count = bulk_action_service.bulk_delete(collection, record_ids, g.current_user_id, scope)
        elif action == "assign":
            new_owner = data.get("assigned_to")
            if not new_owner:
                return error_response("assigned_to is required for assign action.", 422)
            count = bulk_action_service.bulk_assign(collection, record_ids, new_owner, g.current_user_id, scope)
        elif action == "add_tags":
            count = bulk_action_service.bulk_add_tags(collection, record_ids, tags, g.current_user_id, scope)
        elif action == "remove_tags":
            count = bulk_action_service.bulk_remove_tags(collection, record_ids, tags, g.current_user_id, scope)
        else:
            return error_response(f"Unknown action: {action}", 422)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response({"modified_count": count}, message=f"Bulk {action} completed.")
