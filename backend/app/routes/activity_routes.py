"""
Activity Timeline Module routes (SRS Chapter 15).

GET  /api/activities                        (recent activity feed, filterable)
GET  /api/activities/<entity_type>/<entity_id>
POST /api/activities/notes                  (create note activity)
PUT  /api/activities/<activity_id>/note     (edit note body)
"""
from flask import Blueprint, request, g

from app.services import activity_service
from app.services.audit_service import record_activity, record_audit_log
from app.db import get_db
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc, to_object_id, utcnow
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import jwt_required_custom, permission_required

activities_bp = Blueprint("activities", __name__, url_prefix="/api/activities")


@activities_bp.get("")
@jwt_required_custom()
def list_recent_activities():
    page, per_page, skip = get_pagination_params()
    filters = {
        "type": request.args.get("type"),
        "created_by": request.args.get("created_by"),
    }
    activities, total = activity_service.list_recent_activities(skip, per_page, filters)
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(activities), meta=meta)


@activities_bp.get("/<entity_type>/<entity_id>")
@jwt_required_custom()
def list_entity_activities(entity_type, entity_id):
    page, per_page, skip = get_pagination_params()
    activities, total = activity_service.list_activities_for_entity(
        entity_type, entity_id, skip, per_page
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(activities), meta=meta)


@activities_bp.post("/notes")
@jwt_required_custom()
def create_note():
    body = request.get_json(force=True, silent=True) or {}
    description = (body.get("description") or "").strip()
    if not description:
        return error_response("Note body cannot be empty.", 422)

    entity_type = body.get("entity_type")
    entity_id = body.get("entity_id")
    if not entity_type or not entity_id:
        return error_response("entity_type and entity_id are required.", 422)

    activity_id = record_activity(entity_type, entity_id, "note", description, g.current_user_id)
    record_audit_log(g.current_user_id, "create", "activity_note", activity_id)

    db = get_db()
    doc = db.activities.find_one({"_id": to_object_id(activity_id)})
    return success_response(serialize_doc(doc), message="Note created.", status_code=201)


@activities_bp.put("/<activity_id>/note")
@jwt_required_custom()
def update_note(activity_id):
    body = request.get_json(force=True, silent=True) or {}
    description = (body.get("description") or "").strip()
    if not description:
        return error_response("Note body cannot be empty.", 422)

    db = get_db()
    existing = db.activities.find_one({"_id": to_object_id(activity_id)})
    if not existing or existing.get("type") != "note":
        return error_response("Note not found.", 404)

    db.activities.update_one(
        {"_id": to_object_id(activity_id)},
        {"$set": {"description": description, "extra.edited_at": utcnow()}},
    )
    record_audit_log(
        g.current_user_id, "update", "activity_note", activity_id,
        changes={"before": existing.get("description"), "after": description},
    )
    updated = db.activities.find_one({"_id": to_object_id(activity_id)})
    return success_response(serialize_doc(updated), message="Note updated.")
