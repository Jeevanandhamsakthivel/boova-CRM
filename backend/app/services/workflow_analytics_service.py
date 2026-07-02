from datetime import timedelta
from app.db import get_db
from app.utils.helpers import utcnow


def get_analytics_overview(timeframe_days=30):
    db = get_db()
    since = utcnow() - timedelta(days=timeframe_days)

    total_workflows = db.workflows.count_documents({})
    active_workflows = db.workflows.count_documents({"status": "active"})
    total_executions = db.workflow_executions.count_documents({"created_at": {"$gte": since}})
    failed_executions = db.workflow_executions.count_documents({
        "created_at": {"$gte": since}, "status": "failed",
    })
    completed_executions = db.workflow_executions.count_documents({
        "created_at": {"$gte": since}, "status": "completed",
    })

    by_category = list(db.workflows.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))

    by_entity = list(db.workflows.aggregate([
        {"$group": {"_id": "$entity_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))

    executions_by_day = list(db.workflow_executions.aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "failed": {"$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]))

    avg_duration = list(db.workflow_executions.aggregate([
        {"$match": {
            "status": "completed",
            "started_at": {"$ne": None},
            "completed_at": {"$ne": None},
            "created_at": {"$gte": since},
        }},
        {"$project": {
            "duration_ms": {
                "$subtract": ["$completed_at", "$started_at"]
            }
        }},
        {"$group": {
            "_id": None,
            "avg_duration_ms": {"$avg": "$duration_ms"},
            "max_duration_ms": {"$max": "$duration_ms"},
            "min_duration_ms": {"$min": "$duration_ms"},
        }},
    ]))

    node_type_usage = list(db.workflows.aggregate([
        {"$unwind": "$nodes"},
        {"$group": {"_id": "$nodes.type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))

    return {
        "total_workflows": total_workflows,
        "active_workflows": active_workflows,
        "total_executions": total_executions,
        "failed_executions": failed_executions,
        "completed_executions": completed_executions,
        "success_rate": (completed_executions / total_executions * 100) if total_executions else 0,
        "failure_rate": (failed_executions / total_executions * 100) if total_executions else 0,
        "by_category": {c["_id"]: c["count"] for c in by_category},
        "by_entity": {e["_id"]: e["count"] for e in by_entity},
        "executions_by_day": executions_by_day,
        "avg_duration_ms": avg_duration[0]["avg_duration_ms"] if avg_duration else 0,
        "max_duration_ms": avg_duration[0]["max_duration_ms"] if avg_duration else 0,
        "min_duration_ms": avg_duration[0]["min_duration_ms"] if avg_duration else 0,
        "node_type_usage": {n["_id"]: n["count"] for n in node_type_usage},
    }


def get_workflow_performance(workflow_id, timeframe_days=30):
    db = get_db()
    since = utcnow() - timedelta(days=timeframe_days)
    match = {"workflow_id": workflow_id, "created_at": {"$gte": since}}

    total = db.workflow_executions.count_documents(match)
    completed = db.workflow_executions.count_documents({**match, "status": "completed"})
    failed = db.workflow_executions.count_documents({**match, "status": "failed"})

    avg_duration = list(db.workflow_executions.aggregate([
        {"$match": {**match, "status": "completed", "started_at": {"$ne": None}, "completed_at": {"$ne": None}}},
        {"$project": {"duration_ms": {"$subtract": ["$completed_at", "$started_at"]}}},
        {"$group": {"_id": None, "avg": {"$avg": "$duration_ms"}}},
    ]))

    by_status = list(db.workflow_executions.aggregate([
        {"$match": match},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]))

    return {
        "total": total,
        "completed": completed,
        "failed": failed,
        "success_rate": (completed / total * 100) if total else 0,
        "avg_duration_ms": avg_duration[0]["avg"] if avg_duration else 0,
        "by_status": {s["_id"]: s["count"] for s in by_status},
    }
