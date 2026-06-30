from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def create_meeting(data, created_by):
    db = get_db()
    doc = {
        "title": data["title"],
        "description": data.get("description"),
        "meeting_type": data.get("meeting_type", "call"),
        "platform": data.get("platform", "other"),
        "location": data.get("location"),
        "start_time": data["start_time"],
        "end_time": data["end_time"],
        "status": data.get("status", "scheduled"),
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "deal_id": data.get("deal_id"),
        "assigned_to": data.get("assigned_to"),
        "attendees": data.get("attendees", []),
        "meeting_link": data.get("meeting_link"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.meetings.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "meeting", str(doc["_id"]), changes=doc)
    entity_type = "customer" if data.get("customer_id") else "lead" if data.get("lead_id") else None
    entity_id = data.get("customer_id") or data.get("lead_id")
    if entity_type and entity_id:
        record_activity(entity_type, entity_id, "meeting_scheduled",
                        f"Meeting '{doc['title']}' scheduled.", created_by)
    return doc


def get_meeting_by_id(meeting_id):
    db = get_db()
    meeting = db.meetings.find_one({"_id": to_object_id(meeting_id)})
    if not meeting:
        raise NotFoundError("Meeting not found.")
    return meeting


def list_meetings(filters, skip, limit, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["$or"] = [{"assigned_to": scope_user_id}, {"attendees": scope_user_id}]
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("lead_id"):
        query["lead_id"] = filters["lead_id"]
    if filters.get("date_from") or filters.get("date_to"):
        query["start_time"] = {}
        if filters.get("date_from"):
            query["start_time"]["$gte"] = filters["date_from"]
        if filters.get("date_to"):
            query["start_time"]["$lte"] = filters["date_to"]

    total = db.meetings.count_documents(query)
    cursor = db.meetings.find(query).sort("start_time", 1).skip(skip).limit(limit)
    return list(cursor), total


def update_meeting(meeting_id, data, updated_by):
    db = get_db()
    existing = get_meeting_by_id(meeting_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.meetings.update_one({"_id": to_object_id(meeting_id)}, {"$set": update_fields})
    updated = get_meeting_by_id(meeting_id)

    record_audit_log(
        updated_by, "update", "meeting", meeting_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_meeting(meeting_id, deleted_by):
    db = get_db()
    existing = get_meeting_by_id(meeting_id)
    db.meetings.delete_one({"_id": to_object_id(meeting_id)})
    record_audit_log(deleted_by, "delete", "meeting", meeting_id, changes={"deleted_doc": existing})
