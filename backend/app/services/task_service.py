"""
Service layer for Task Management (SRS Chapter 14).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def create_task(data, created_by):
    db = get_db()
    
    # If there's a related entity, verify it exists (optional but good practice)
    related_to = None
    if data.get("related_to_type") and data.get("related_to_id"):
        related_to = {
            "type": data["related_to_type"],
            "id": data["related_to_id"]
        }

    doc = {
        "title": data["title"],
        "description": data.get("description"),
        "status": data.get("status", "todo"),
        "priority": data.get("priority", "medium"),
        "due_date": data.get("due_date"),
        "assigned_to": data["assigned_to"],
        "related_to": related_to,
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow()
    }
    
    result = db.tasks.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    record_audit_log(created_by, "create", "task", str(doc["_id"]), changes=doc)
    
    if related_to:
        record_activity(
            related_to["type"], related_to["id"], "task_created",
            f"Task '{doc['title']}' created and assigned to {doc['assigned_to']}.", created_by
        )
        
    return doc


def get_task_by_id(task_id):
    db = get_db()
    task = db.tasks.find_one({"_id": to_object_id(task_id)})
    if not task:
        raise NotFoundError("Task not found.")
    return task


def list_tasks(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("priority"):
        query["priority"] = filters["priority"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("related_to_id"):
        query["related_to.id"] = filters["related_to_id"]
    if filters.get("search"):
        # Text or regex fallback search
        regex = {"$regex": filters["search"], "$options": "i"}
        query["$or"] = [{"title": regex}, {"description": regex}]

    total = db.tasks.count_documents(query)
    cursor = db.tasks.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_task(task_id, data, updated_by):
    db = get_db()
    existing = get_task_by_id(task_id)
    
    update_fields = {k: v for k, v in data.items() if v is not None}
    
    # Handle related_to mapping if they are updated
    if "related_to_type" in data or "related_to_id" in data:
        rel_type = data.get("related_to_type") or (existing.get("related_to") or {}).get("type")
        rel_id = data.get("related_to_id") or (existing.get("related_to") or {}).get("id")
        if rel_type and rel_id:
            update_fields["related_to"] = {"type": rel_type, "id": rel_id}
        else:
            update_fields["related_to"] = None
            
        if "related_to_type" in update_fields:
            del update_fields["related_to_type"]
        if "related_to_id" in update_fields:
            del update_fields["related_to_id"]
            
    update_fields["updated_at"] = utcnow()
    
    db.tasks.update_one({"_id": to_object_id(task_id)}, {"$set": update_fields})
    updated = get_task_by_id(task_id)
    
    record_audit_log(
        updated_by, "update", "task", task_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields}
    )
    
    if "status" in update_fields and update_fields["status"] != existing.get("status"):
        if updated.get("related_to"):
            record_activity(
                updated["related_to"]["type"], updated["related_to"]["id"], "task_status_change",
                f"Task '{updated['title']}' status changed from '{existing.get('status')}' to '{updated['status']}'.",
                updated_by
            )
            
    return updated


def delete_task(task_id, deleted_by):
    db = get_db()
    existing = get_task_by_id(task_id)
    db.tasks.delete_one({"_id": to_object_id(task_id)})
    record_audit_log(deleted_by, "delete", "task", task_id, changes={"deleted_doc": existing})
