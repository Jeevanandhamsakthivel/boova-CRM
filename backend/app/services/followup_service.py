"""
Service layer for Follow-Up Management (SRS Chapter 13).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def create_followup(data, created_by):
    db = get_db()
    doc = {
        "title": data["title"],
        "type": data.get("type", "call"),
        "description": data.get("description"),
        "due_date": data["due_date"],
        "status": data.get("status", "pending"),
        "assigned_to": data["assigned_to"],
        "related_to": {"type": data["related_to_type"], "id": data["related_to_id"]},
        "reminder_minutes_before": data.get("reminder_minutes_before", 30),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.followups.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "followup", str(doc["_id"]), changes=doc)
    record_activity(
        data["related_to_type"], data["related_to_id"], "followup_scheduled",
        f"Follow-up '{doc['title']}' scheduled.", created_by,
    )
    return doc


def get_followup_by_id(followup_id):
    db = get_db()
    followup = db.followups.find_one({"_id": to_object_id(followup_id)})
    if not followup:
        raise NotFoundError("Follow-up not found.")
    return followup


def list_followups(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("type"):
        query["type"] = filters["type"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("related_to_id"):
        query["related_to.id"] = filters["related_to_id"]

    total = db.followups.count_documents(query)
    cursor = db.followups.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_followup(followup_id, data, updated_by):
    db = get_db()
    existing = get_followup_by_id(followup_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.followups.update_one({"_id": to_object_id(followup_id)}, {"$set": update_fields})
    updated = get_followup_by_id(followup_id)

    record_audit_log(
        updated_by, "update", "followup", followup_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    if update_fields.get("status") == "completed":
        record_activity(
            existing["related_to"]["type"], existing["related_to"]["id"], "followup_completed",
            f"Follow-up '{existing['title']}' marked completed.", updated_by,
        )
    return updated


def delete_followup(followup_id, deleted_by):
    db = get_db()
    existing = get_followup_by_id(followup_id)
    db.followups.delete_one({"_id": to_object_id(followup_id)})
    record_audit_log(deleted_by, "delete", "followup", followup_id, changes={"deleted_doc": existing})