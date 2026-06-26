"""
Audit logging service, per SRS Chapter 37 (Audit Logs) and the
"Activity Logs" backend requirement repeated in every module spec.

Every create/update/delete across every module writes an audit_logs entry
capturing who did what, to which entity, and what changed.
"""
from app.db import get_db
from app.utils.helpers import utcnow


def record_audit_log(user_id, action, entity_type, entity_id, changes=None, metadata=None):
    """
    action: one of "create", "update", "delete", "login", "logout", etc.
    entity_type: e.g. "lead", "customer", "task"
    changes: optional dict describing before/after or field deltas
    """
    db = get_db()
    db.audit_logs.insert_one(
        {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "changes": changes or {},
            "metadata": metadata or {},
            "created_at": utcnow(),
        }
    )


def record_activity(entity_type, entity_id, activity_type, description, created_by, extra=None):
    """
    Activity Timeline entries (Chapter 15), distinct from audit logs:
    audit_logs are for compliance/security tracking, activities are the
    customer/lead-facing timeline (calls, emails, notes, status changes).
    """
    db = get_db()
    doc = {
        "related_to": {"type": entity_type, "id": entity_id},
        "type": activity_type,
        "description": description,
        "created_by": created_by,
        "created_at": utcnow(),
        "extra": extra or {},
    }
    result = db.activities.insert_one(doc)
    return str(result.inserted_id)


def list_audit_logs(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("user_id"):
        query["user_id"] = filters["user_id"]
    if filters.get("entity_type"):
        query["entity_type"] = filters["entity_type"]
    if filters.get("entity_id"):
        query["entity_id"] = filters["entity_id"]
    if filters.get("action"):
        query["action"] = filters["action"]

    total = db.audit_logs.count_documents(query)
    cursor = db.audit_logs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total