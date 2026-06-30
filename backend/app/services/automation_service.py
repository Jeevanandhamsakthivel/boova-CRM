from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log


def create_automation(data, created_by):
    db = get_db()
    doc = {
        "name": data["name"],
        "description": data.get("description"),
        "status": data.get("status", "draft"),
        "trigger": data["trigger"],
        "actions": data["actions"],
        "object_type": data["object_type"],
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.automations.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "automation", str(doc["_id"]), changes=doc)
    return doc


def get_automation_by_id(automation_id):
    db = get_db()
    automation = db.automations.find_one({"_id": to_object_id(automation_id)})
    if not automation:
        raise NotFoundError("Automation not found.")
    return automation


def list_automations(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("object_type"):
        query["object_type"] = filters["object_type"]

    total = db.automations.count_documents(query)
    cursor = db.automations.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total


def update_automation(automation_id, data, updated_by):
    db = get_db()
    existing = get_automation_by_id(automation_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.automations.update_one({"_id": to_object_id(automation_id)}, {"$set": update_fields})
    updated = get_automation_by_id(automation_id)

    record_audit_log(
        updated_by, "update", "automation", automation_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_automation(automation_id, deleted_by):
    db = get_db()
    existing = get_automation_by_id(automation_id)
    db.automations.delete_one({"_id": to_object_id(automation_id)})
    record_audit_log(deleted_by, "delete", "automation", automation_id, changes={"deleted_doc": existing})


def evaluate_trigger(event_type, event_data):
    """Evaluate all active automations matching the trigger type."""
    db = get_db()
    automations = db.automations.find({
        "status": "active",
        "trigger.type": event_type,
    })
    results = []
    for automation in automations:
        trigger = automation.get("trigger", {})
        conditions = trigger.get("conditions", {})
        matched = True
        for key, expected_value in conditions.items():
            actual_value = event_data.get(key)
            if actual_value != expected_value:
                matched = False
                break
        if matched:
            results.append({
                "automation_id": str(automation["_id"]),
                "name": automation["name"],
                "actions": automation.get("actions", []),
            })
    return results
