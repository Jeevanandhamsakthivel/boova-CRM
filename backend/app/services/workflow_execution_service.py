from datetime import timedelta
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, AppError
from app.services.workflow_service import get_workflow_by_id


def create_execution(data, triggered_by=None):
    db = get_db()
    workflow_id = data["workflow_id"]
    workflow = get_workflow_by_id(workflow_id)
    if workflow.get("status") != "active":
        raise AppError("Cannot execute an inactive workflow.", 422)

    doc = {
        "workflow_id": workflow_id,
        "workflow_name": workflow.get("name"),
        "entity_type": data["entity_type"],
        "entity_id": data["entity_id"],
        "trigger_type": data.get("trigger_type", "manual"),
        "triggered_by": triggered_by,
        "status": "pending",
        "node_logs": [],
        "input_data": data.get("input_data", {}),
        "output_data": {},
        "error": None,
        "started_at": None,
        "completed_at": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.workflow_executions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_execution_by_id(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc:
        raise NotFoundError("Workflow execution not found.")
    return exec_doc


def list_executions(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("workflow_id"):
        query["workflow_id"] = filters["workflow_id"]
    if filters.get("entity_type"):
        query["entity_type"] = filters["entity_type"]
    if filters.get("entity_id"):
        query["entity_id"] = filters["entity_id"]
    if filters.get("trigger_type"):
        query["trigger_type"] = filters["trigger_type"]
    total = db.workflow_executions.count_documents(query)
    cursor = db.workflow_executions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total


def start_execution(execution_id):
    db = get_db()
    exec_doc = get_execution_by_id(execution_id)
    if exec_doc["status"] != "pending":
        raise AppError("Only pending executions can be started.", 422)
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"status": "running", "started_at": utcnow(), "updated_at": utcnow()}},
    )
    return get_execution_by_id(execution_id)


def complete_execution(execution_id, output_data=None):
    db = get_db()
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {
            "$set": {
                "status": "completed",
                "output_data": output_data or {},
                "completed_at": utcnow(),
                "updated_at": utcnow(),
            }
        },
    )
    return get_execution_by_id(execution_id)


def fail_execution(execution_id, error_message):
    db = get_db()
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {
            "$set": {
                "status": "failed",
                "error": error_message,
                "completed_at": utcnow(),
                "updated_at": utcnow(),
            }
        },
    )
    return get_execution_by_id(execution_id)


def cancel_execution(execution_id):
    db = get_db()
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"status": "cancelled", "completed_at": utcnow(), "updated_at": utcnow()}},
    )
    return get_execution_by_id(execution_id)


def update_node_log(execution_id, node_log):
    db = get_db()
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$push": {"node_logs": node_log}, "$set": {"updated_at": utcnow()}},
    )
    return get_execution_by_id(execution_id)


def get_execution_stats(timeframe_days=30):
    db = get_db()
    since = utcnow() - timedelta(days=timeframe_days)
    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
        }}
    ]
    results = list(db.workflow_executions.aggregate(pipeline))
    stats = {"total": 0, "running": 0, "completed": 0, "failed": 0, "cancelled": 0, "pending": 0}
    for r in results:
        stats[r["_id"]] = r["count"]
        stats["total"] += r["count"]
    recent = list(
        db.workflow_executions.find({"created_at": {"$gte": since}})
        .sort("created_at", -1)
        .limit(10)
    )
    stats["recent"] = recent
    return stats
