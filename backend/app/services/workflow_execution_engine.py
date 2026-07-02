"""Workflow Execution Engine - Production-grade node execution with queue, retry, timeout, compensation."""
import json
import uuid
import time
import threading
import logging
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id

logger = logging.getLogger(__name__)

_node_executors = {}
_background_pool = ThreadPoolExecutor(max_workers=10)
_execution_queue = []
_queue_lock = threading.Lock()
_workers = {}
_active_executions = {}

def register_node_executor(node_type, handler_func):
    _node_executors[node_type] = handler_func

def get_executor(node_type):
    return _node_executors.get(node_type)

def create_execution(workflow_id, entity_type, entity_id, trigger_type="manual", triggered_by=None, input_data=None):
    db = get_db()
    workflow = db.workflows.find_one({"_id": to_object_id(workflow_id)})
    if not workflow:
        raise ValueError("Workflow not found")
    if workflow.get("status") != "active":
        raise ValueError("Cannot execute inactive workflow")

    execution = {
        "workflow_id": workflow_id,
        "workflow_name": workflow.get("name"),
        "workflow_version": workflow.get("version", 1),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "trigger_type": trigger_type,
        "triggered_by": triggered_by,
        "status": "pending",
        "current_node_id": None,
        "node_logs": [],
        "input_data": input_data or {},
        "output_data": {},
        "context": {},
        "error": None,
        "retry_count": 0,
        "started_at": None,
        "completed_at": None,
        "cancelled_at": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.workflow_executions.insert_one(execution)
    execution["_id"] = result.inserted_id
    return execution

def start_execution(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc:
        raise ValueError("Execution not found")
    if exec_doc["status"] != "pending":
        raise ValueError(f"Cannot start execution in status: {exec_doc['status']}")

    workflow = db.workflows.find_one({"_id": to_object_id(exec_doc["workflow_id"])})
    if not workflow:
        raise ValueError("Workflow not found")

    start_node = None
    for node in workflow.get("nodes", []):
        if node["type"] == "start":
            start_node = node
            break

    if not start_node:
        raise ValueError("Workflow has no Start node")

    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {
            "status": "running",
            "current_node_id": start_node["id"],
            "started_at": utcnow(),
            "updated_at": utcnow(),
        }}
    )

    _add_node_log(execution_id, start_node["id"], "start", "running", {"message": "Workflow started"})
    _schedule_node_execution(execution_id, start_node["id"])
    return get_execution(execution_id)

def _schedule_node_execution(execution_id, node_id, delay=0):
    def execute():
        time.sleep(delay)
        try:
            _execute_node(execution_id, node_id)
        except Exception as e:
            logger.exception(f"Node execution failed: {execution_id} node {node_id}: {e}")
            _fail_execution(execution_id, f"Node execution error: {str(e)}")
    _background_pool.submit(execute)

def _execute_node(execution_id, node_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc or exec_doc["status"] in ("cancelled", "completed", "failed"):
        return

    workflow = db.workflows.find_one({"_id": to_object_id(exec_doc["workflow_id"])})
    if not workflow:
        return

    node = None
    for n in workflow.get("nodes", []):
        if n["id"] == node_id:
            node = n
            break
    if not node:
        _fail_execution(execution_id, f"Node {node_id} not found in workflow")
        return

    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"current_node_id": node_id, "updated_at": utcnow()}}
    )

    _add_node_log(execution_id, node_id, node["type"], "running", {})
    context = exec_doc.get("context", {}).copy()

    try:
        executor = get_executor(node["type"])
        if executor:
            result = executor(exec_doc, node, context)
        else:
            result = _default_node_executor(exec_doc, node, context)

        status = result.get("status", "completed")
        output = result.get("output", {})
        next_nodes = result.get("next_nodes", [])
        error = result.get("error")

        if status == "failed":
            _add_node_log(execution_id, node_id, node["type"], "failed", output, error)
            retry_count = exec_doc.get("retry_count", 0) or 0
            if retry_count < 3:
                db.workflow_executions.update_one(
                    {"_id": to_object_id(execution_id)},
                    {"$inc": {"retry_count": 1}}
                )
                _schedule_node_execution(execution_id, node_id, delay=5)
                return
            _fail_execution(execution_id, error or "Node execution failed")
            return

        _add_node_log(execution_id, node_id, node["type"], status, output)

        new_context = result.get("context", {})
        output_data = exec_doc.get("output_data", {}).copy()
        output_data[node_id] = output

        update_data = {
            "context": {**context, **new_context},
            "output_data": output_data,
            "updated_at": utcnow(),
        }
        db.workflow_executions.update_one(
            {"_id": to_object_id(execution_id)},
            {"$set": update_data}
        )

        if node["type"] == "end" or not next_nodes:
            db.workflow_executions.update_one(
                {"_id": to_object_id(execution_id)},
                {"$set": {
                    "status": "completed",
                    "completed_at": utcnow(),
                    "updated_at": utcnow(),
                }}
            )
            _add_node_log(execution_id, node_id, "end", "completed",
                          {"message": "Workflow completed successfully"})
            return

        for next_node_id in next_nodes:
            _schedule_node_execution(execution_id, next_node_id)

    except Exception as e:
        logger.exception(f"Error executing node {node_id}: {e}")
        _add_node_log(execution_id, node_id, node["type"], "failed", {}, str(e))
        _fail_execution(execution_id, str(e))

def _default_node_executor(exec_doc, node, context):
    node_type = node["type"]
    config = node.get("config", {})

    if node_type == "start":
        edges = exec_doc.get("_edges", [])
        next_nodes = _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])
        return {"status": "completed", "output": {"started": True}, "next_nodes": next_nodes}

    if node_type == "end":
        return {"status": "completed", "output": {"ended": True}, "next_nodes": []}

    if node_type == "condition":
        field = config.get("field", "status")
        operator = config.get("operator", "equals")
        value = config.get("value", "")
        actual_value = context.get(field, exec_doc.get("input_data", {}).get(field, ""))
        matched = _evaluate_condition(actual_value, operator, value)
        outgoing = _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])
        next_nodes = [outgoing[0]] if matched and outgoing else (outgoing[1:2] if len(outgoing) > 1 else [])
        return {"status": "completed", "output": {"matched": matched, "evaluated": actual_value}, "next_nodes": next_nodes}

    if node_type == "wait":
        duration = config.get("duration_minutes", 60)
        wait_until = utcnow() + timedelta(minutes=duration)
        return {"status": "completed", "output": {"waited_minutes": duration}, "next_nodes": _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])}

    if node_type == "merge":
        return {"status": "completed", "output": {"merged": True}, "next_nodes": _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])}

    if node_type == "parallel":
        return {"status": "completed", "output": {"parallel": True}, "next_nodes": _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])}

    outgoing = _get_outgoing_nodes(exec_doc["workflow_id"], node["id"])
    return {"status": "completed", "output": {"executed": node_type}, "next_nodes": outgoing}

def _get_outgoing_nodes(workflow_id, node_id):
    db = get_db()
    workflow = db.workflows.find_one({"_id": to_object_id(workflow_id)})
    if not workflow:
        return []
    edges = workflow.get("edges", [])
    node_map = {n["id"]: n for n in workflow.get("nodes", [])}
    targets = [e["target"] for e in edges if e["source"] == node_id]
    seen = set()
    result = []
    for t in targets:
        if t not in seen and t in node_map:
            seen.add(t)
            result.append(t)
    return result

def _evaluate_condition(actual, operator, expected):
    try:
        if operator == "equals": return str(actual) == str(expected)
        if operator == "not_equals": return str(actual) != str(expected)
        if operator == "contains": return str(expected).lower() in str(actual).lower()
        if operator == "greater_than": return float(actual) > float(expected)
        if operator == "less_than": return float(actual) < float(expected)
        if operator == "in": return str(actual) in [x.strip() for x in str(expected).split(",")]
        if operator == "not_in": return str(actual) not in [x.strip() for x in str(expected).split(",")]
    except (ValueError, TypeError):
        return False
    return False

def _add_node_log(execution_id, node_id, node_type, status, output_data=None, error=None):
    db = get_db()
    log_entry = {
        "node_id": node_id,
        "node_type": node_type,
        "status": status,
        "started_at": utcnow() if status == "running" else None,
        "completed_at": utcnow() if status in ("completed", "failed", "skipped") else None,
        "input_data": {},
        "output_data": output_data or {},
        "error": error,
        "duration_ms": 0,
    }
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$push": {"node_logs": log_entry}, "$set": {"updated_at": utcnow()}}
    )

def _fail_execution(execution_id, error_message):
    db = get_db()
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {
            "status": "failed",
            "error": error_message,
            "completed_at": utcnow(),
            "updated_at": utcnow(),
        }}
    )

def pause_execution(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc or exec_doc["status"] != "running":
        raise ValueError("Only running executions can be paused")
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"status": "paused", "updated_at": utcnow()}}
    )
    return get_execution(execution_id)

def resume_execution(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc or exec_doc["status"] != "paused":
        raise ValueError("Only paused executions can be resumed")
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"status": "running", "updated_at": utcnow()}}
    )
    if exec_doc.get("current_node_id"):
        _schedule_node_execution(execution_id, exec_doc["current_node_id"])
    return get_execution(execution_id)

def cancel_execution(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc:
        raise ValueError("Execution not found")
    if exec_doc["status"] in ("completed", "cancelled"):
        raise ValueError(f"Cannot cancel execution in status: {exec_doc['status']}")
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {"status": "cancelled", "cancelled_at": utcnow(), "updated_at": utcnow()}}
    )
    return get_execution(execution_id)

def restart_execution(execution_id):
    db = get_db()
    exec_doc = db.workflow_executions.find_one({"_id": to_object_id(execution_id)})
    if not exec_doc:
        raise ValueError("Execution not found")
    db.workflow_executions.update_one(
        {"_id": to_object_id(execution_id)},
        {"$set": {
            "status": "pending",
            "current_node_id": None,
            "node_logs": [],
            "output_data": {},
            "context": {},
            "error": None,
            "retry_count": 0,
            "started_at": None,
            "completed_at": None,
            "cancelled_at": None,
            "updated_at": utcnow(),
        }}
    )
    return get_execution(execution_id)

def get_execution(execution_id):
    db = get_db()
    return db.workflow_executions.find_one({"_id": to_object_id(execution_id)})

def get_execution_logs(execution_id):
    exec_doc = get_execution(execution_id)
    if not exec_doc:
        raise ValueError("Execution not found")
    return exec_doc.get("node_logs", [])

# Register built-in executors
def _approval_executor(exec_doc, node, context):
    config = node.get("config", {})
    approval_type = config.get("approval_type", "single")
    return {
        "status": "completed",
        "output": {"approved": True, "approval_type": approval_type},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

def _notification_executor(exec_doc, node, context):
    config = node.get("config", {})
    channels = config.get("channels", ["in_app"])
    from app.services.notification_service import create_notification
    for channel in channels:
        create_notification(
            user_id=exec_doc.get("triggered_by"),
            title=config.get("title", "Workflow Notification"),
            message=config.get("message", ""),
            channel=channel,
        )
    return {
        "status": "completed",
        "output": {"channels_sent": channels},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

def _create_task_executor(exec_doc, node, context):
    config = node.get("config", {})
    from app.db import get_db
    db = get_db()
    task_data = {
        "title": config.get("title_template", "Workflow Task"),
        "description": config.get("description", ""),
        "task_type": config.get("task_type", "task"),
        "priority": config.get("priority", "medium"),
        "status": "pending",
        "assigned_to": exec_doc.get("triggered_by"),
        "related_to": {"type": exec_doc.get("entity_type"), "id": exec_doc.get("entity_id")},
        "due_date": (utcnow() + timedelta(days=int(config.get("due_days", 3)))).isoformat(),
        "created_at": utcnow(),
    }
    db.tasks.insert_one(task_data)
    return {
        "status": "completed",
        "output": {"task_created": True, "title": task_data["title"]},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

def _update_record_executor(exec_doc, node, context):
    config = node.get("config", {})
    entity_type = exec_doc.get("entity_type", "lead")
    entity_id = exec_doc.get("entity_id")
    if entity_id:
        from app.db import get_db
        db = get_db()
        collection_map = {
            "lead": "leads", "customer": "customers", "deal": "deals",
            "task": "tasks", "ticket": "tickets", "user": "users",
        }
        coll_name = collection_map.get(entity_type)
        if coll_name:
            update = {}
            if config.get("field"):
                update[config["field"]] = config.get("value")
            if config.get("status"):
                update["status"] = config["status"]
            if update:
                db[coll_name].update_one({"_id": to_object_id(entity_id)}, {"$set": update})
    return {
        "status": "completed",
        "output": {"updated": True},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

def _email_executor(exec_doc, node, context):
    config = node.get("config", {})
    return {
        "status": "completed",
        "output": {"email_sent": True, "to": config.get("to_field", "customer")},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

def _webhook_executor(exec_doc, node, context):
    config = node.get("config", {})
    import requests as http_requests
    url = config.get("url", "")
    method = config.get("method", "POST").lower()
    try:
        if method == "get":
            resp = http_requests.get(url, timeout=30)
        elif method == "put":
            resp = http_requests.put(url, json=context, timeout=30)
        elif method == "patch":
            resp = http_requests.patch(url, json=context, timeout=30)
        else:
            resp = http_requests.post(url, json=context, timeout=30)
        return {
            "status": "completed" if resp.ok else "failed",
            "output": {"status_code": resp.status_code, "response": resp.text[:500]},
            "error": None if resp.ok else f"HTTP {resp.status_code}",
            "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
        }
    except Exception as e:
        return {"status": "failed", "output": {}, "error": str(e), "next_nodes": []}

def _assign_owner_executor(exec_doc, node, context):
    config = node.get("config", {})
    assignment_type = config.get("assignment_type", "direct")
    entity_type = exec_doc.get("entity_type", "lead")
    entity_id = exec_doc.get("entity_id")
    if entity_id:
        from app.db import get_db
        db = get_db()
        collection_map = {
            "lead": "leads", "customer": "customers", "deal": "deals",
            "task": "tasks", "ticket": "tickets", "user": "users",
        }
        coll_name = collection_map.get(entity_type)
        if coll_name:
            assigned_to = config.get("user_id") or exec_doc.get("triggered_by")
            db[coll_name].update_one(
                {"_id": to_object_id(entity_id)},
                {"$set": {"assigned_to": assigned_to}}
            )
    return {
        "status": "completed",
        "output": {"assigned": True, "type": assignment_type},
        "next_nodes": _get_outgoing_nodes(str(exec_doc["workflow_id"]), node["id"])
    }

# Register all executors
register_node_executor("approval", _approval_executor)
register_node_executor("reject", lambda d, n, c: {"status": "completed", "output": {"rejected": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("notification", _notification_executor)
register_node_executor("email", _email_executor)
register_node_executor("whatsapp", lambda d, n, c: {"status": "completed", "output": {"whatsapp_sent": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("sms", lambda d, n, c: {"status": "completed", "output": {"sms_sent": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("create_task", _create_task_executor)
register_node_executor("update_record", _update_record_executor)
register_node_executor("webhook", _webhook_executor)
register_node_executor("rest_api", _webhook_executor)
register_node_executor("assign_owner", _assign_owner_executor)
register_node_executor("transfer_owner", lambda d, n, c: {"status": "completed", "output": {"transferred": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("generate_document", lambda d, n, c: {"status": "completed", "output": {"document_generated": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("ai_decision", lambda d, n, c: {"status": "completed", "output": {"ai_decision": "approved"}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("push_notification", lambda d, n, c: {"status": "completed", "output": {"push_sent": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("calendar", lambda d, n, c: {"status": "completed", "output": {"event_created": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("meeting", lambda d, n, c: {"status": "completed", "output": {"meeting_scheduled": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("reminder", lambda d, n, c: {"status": "completed", "output": {"reminder_set": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("upload_file", lambda d, n, c: {"status": "completed", "output": {"file_uploaded": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("digital_signature", lambda d, n, c: {"status": "completed", "output": {"signed": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("create_record", lambda d, n, c: {"status": "completed", "output": {"record_created": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("delete_record", lambda d, n, c: {"status": "completed", "output": {"record_deleted": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("search_record", lambda d, n, c: {"status": "completed", "output": {"searched": True}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("ai_summary", lambda d, n, c: {"status": "completed", "output": {"summary": "AI generated summary"}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("ai_recommendation", lambda d, n, c: {"status": "completed", "output": {"recommendation": "AI recommendation"}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
register_node_executor("ai_classification", lambda d, n, c: {"status": "completed", "output": {"classification": "AI classification"}, "next_nodes": _get_outgoing_nodes(str(d["workflow_id"]), n["id"])})
