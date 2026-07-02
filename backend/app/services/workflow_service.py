from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, AppError
from app.services.audit_service import record_audit_log


def create_workflow(data, created_by):
    db = get_db()
    doc = {
        "name": data["name"],
        "description": data.get("description"),
        "category": data["category"],
        "status": data.get("status", "draft"),
        "entity_type": data["entity_type"],
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "stages": data.get("stages", []),
        "assigned_to": data.get("assigned_to"),
        "department": data.get("department"),
        "tags": data.get("tags", []),
        "config": data.get("config", {}),
        "version": 1,
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.workflows.insert_one(doc)
    doc["_id"] = result.inserted_id
    record_audit_log(created_by, "create", "workflow", str(doc["_id"]), changes=doc)
    return doc


def get_workflow_by_id(workflow_id):
    db = get_db()
    wf = db.workflows.find_one({"_id": to_object_id(workflow_id)})
    if not wf:
        raise NotFoundError("Workflow not found.")
    return wf


def list_workflows(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("category"):
        query["category"] = filters["category"]
    if filters.get("entity_type"):
        query["entity_type"] = filters["entity_type"]
    if filters.get("search"):
        query["$or"] = [
            {"name": {"$regex": filters["search"], "$options": "i"}},
            {"description": {"$regex": filters["search"], "$options": "i"}},
        ]
    total = db.workflows.count_documents(query)
    cursor = db.workflows.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    return list(cursor), total


def update_workflow(workflow_id, data, updated_by):
    db = get_db()
    existing = get_workflow_by_id(workflow_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()
    update_fields["version"] = existing.get("version", 1) + 1
    db.workflows.update_one({"_id": to_object_id(workflow_id)}, {"$set": update_fields})
    updated = get_workflow_by_id(workflow_id)
    record_audit_log(
        updated_by, "update", "workflow", workflow_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_workflow(workflow_id, deleted_by):
    db = get_db()
    existing = get_workflow_by_id(workflow_id)
    db.workflows.delete_one({"_id": to_object_id(workflow_id)})
    record_audit_log(deleted_by, "delete", "workflow", workflow_id, changes={"deleted_doc": existing})


def duplicate_workflow(workflow_id, created_by):
    db = get_db()
    existing = get_workflow_by_id(workflow_id)
    doc = {k: v for k, v in existing.items() if k not in ("_id", "created_at", "updated_at", "version")}
    doc["name"] = f"{doc['name']} (Copy)"
    doc["status"] = "draft"
    doc["version"] = 1
    doc["created_by"] = created_by
    doc["created_at"] = utcnow()
    doc["updated_at"] = utcnow()
    result = db.workflows.insert_one(doc)
    doc["_id"] = result.inserted_id
    record_audit_log(created_by, "create", "workflow", str(doc["_id"]), changes={"duplicated_from": workflow_id})
    return doc


def get_workflow_stats():
    db = get_db()
    total = db.workflows.count_documents({})
    active = db.workflows.count_documents({"status": "active"})
    inactive = db.workflows.count_documents({"status": "inactive"})
    draft = db.workflows.count_documents({"status": "draft"})
    categories = list(db.workflows.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "draft": draft,
        "categories": {c["_id"]: c["count"] for c in categories},
    }


def get_workflow_entity_references(entity_type, search=None, skip=0, limit=20):
    db = get_db()
    collection_map = {
        "lead": "leads", "customer": "customers", "company": "companies",
        "deal": "deals", "task": "tasks", "ticket": "tickets",
        "user": "users", "quote": "quotes", "invoice": "invoices",
        "contact": "customers",
    }
    coll = collection_map.get(entity_type)
    if not coll:
        return [], 0
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    total = db[coll].count_documents(query)
    cursor = db[coll].find(query, {"_id": 1, "name": 1, "email": 1, "status": 1}).skip(skip).limit(limit)
    return list(cursor), total


def activate_workflow(workflow_id, updated_by):
    db = get_db()
    existing = get_workflow_by_id(workflow_id)
    if not existing.get("nodes") or len(existing.get("nodes", [])) < 2:
        raise AppError("Workflow must have at least a Start and End node to activate.", 422)
    db.workflows.update_one(
        {"_id": to_object_id(workflow_id)},
        {"$set": {"status": "active", "updated_at": utcnow()}},
    )
    record_audit_log(updated_by, "activate", "workflow", workflow_id)
    return get_workflow_by_id(workflow_id)


def deactivate_workflow(workflow_id, updated_by):
    db = get_db()
    db.workflows.update_one(
        {"_id": to_object_id(workflow_id)},
        {"$set": {"status": "inactive", "updated_at": utcnow()}},
    )
    record_audit_log(updated_by, "deactivate", "workflow", workflow_id)
    return get_workflow_by_id(workflow_id)
