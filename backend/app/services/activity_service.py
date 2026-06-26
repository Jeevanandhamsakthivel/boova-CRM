"""
Service layer for Activity Timeline Module (SRS Chapter 15).
Write operations live in audit_service.record_activity(); this module
covers the read/query side used by the timeline UI.
"""
from app.db import get_db
from app.utils.helpers import to_object_id


def list_activities_for_entity(entity_type, entity_id, skip, limit):
    db = get_db()
    query = {"related_to.type": entity_type, "related_to.id": entity_id}
    total = db.activities.count_documents(query)
    cursor = db.activities.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total


def list_recent_activities(skip, limit, filters=None):
    db = get_db()
    query = {}
    filters = filters or {}
    if filters.get("type"):
        query["type"] = filters["type"]
    if filters.get("created_by"):
        query["created_by"] = filters["created_by"]

    total = db.activities.count_documents(query)
    cursor = db.activities.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total