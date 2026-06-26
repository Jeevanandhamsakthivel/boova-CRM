"""
Activity Timeline Module routes (SRS Chapter 15).

GET /api/activities                 (recent activity feed, filterable)
GET /api/activities/<entity_type>/<entity_id>
"""
from flask import Blueprint, request

from app.services import activity_service
from app.utils.responses import success_response
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta
from app.middlewares.auth_middleware import jwt_required_custom

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