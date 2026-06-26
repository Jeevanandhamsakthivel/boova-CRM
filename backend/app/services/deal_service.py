"""
Service layer for Sales Pipeline Module (SRS Chapter 16).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, ConflictError
from app.services.audit_service import record_audit_log, record_activity


def list_stages():
    db = get_db()
    stages = list(db.pipeline_stages.find().sort("order", 1))
    return stages


def create_stage(data, created_by):
    db = get_db()
    existing = db.pipeline_stages.find_one({"name": data["name"]})
    if existing:
        raise ConflictError("A stage with this name already exists.")

    doc = {
        "name": data["name"],
        "order": data["order"],
        "win_probability": data.get("win_probability", 0),
        "color": data.get("color", "#3B82F6"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.pipeline_stages.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "pipeline_stage", str(doc["_id"]), changes=doc)
    return doc


def get_stage_by_id(stage_id):
    db = get_db()
    stage = db.pipeline_stages.find_one({"_id": to_object_id(stage_id)})
    if not stage:
        raise NotFoundError("Pipeline stage not found.")
    return stage


def update_stage(stage_id, data, updated_by):
    db = get_db()
    existing = get_stage_by_id(stage_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.pipeline_stages.update_one({"_id": to_object_id(stage_id)}, {"$set": update_fields})
    updated = get_stage_by_id(stage_id)

    record_audit_log(
        updated_by,
        "update",
        "pipeline_stage",
        stage_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_stage(stage_id, deleted_by):
    db = get_db()
    existing = get_stage_by_id(stage_id)

    # Check if any deals are in this stage
    deals_count = db.deals.count_documents({"stage_id": stage_id})
    if deals_count > 0:
        raise ConflictError("Cannot delete stage because it contains deals.")

    db.pipeline_stages.delete_one({"_id": to_object_id(stage_id)})
    record_audit_log(deleted_by, "delete", "pipeline_stage", stage_id, changes={"deleted_doc": existing})


def get_pipeline_summary():
    db = get_db()
    stages = list(db.pipeline_stages.find().sort("order", 1))
    summary = []
    for stage in stages:
        stage_id_str = str(stage["_id"])
        deals = list(db.deals.find({"stage_id": stage_id_str}))
        total_value = sum(deal.get("value", 0) for deal in deals)
        summary.append(
            {
                "stage": stage,
                "deals": deals,
                "total_value": total_value,
                "deals_count": len(deals),
            }
        )
    return summary


def list_deals(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("stage_id"):
        query["stage_id"] = filters["stage_id"]
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]

    total = db.deals.count_documents(query)
    cursor = db.deals.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def create_deal(data, created_by):
    db = get_db()
    # Verify customer exists
    customer_id = data["customer_id"]
    customer = db.customers.find_one({"_id": to_object_id(customer_id)})
    if not customer:
        raise NotFoundError("Customer not found.")

    # Verify stage exists
    stage_id = data["stage_id"]
    stage = db.pipeline_stages.find_one({"_id": to_object_id(stage_id)})
    if not stage:
        raise NotFoundError("Pipeline stage not found.")

    doc = {
        "title": data["title"],
        "customer_id": customer_id,
        "stage_id": stage_id,
        "value": data.get("value", 0.0),
        "status": data.get("status", "open"),
        "assigned_to": data["assigned_to"],
        "expected_close_date": data.get("expected_close_date"),
        "notes": data.get("notes"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.deals.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "deal", str(doc["_id"]), changes=doc)
    record_activity(
        "customer",
        customer_id,
        "deal_created",
        f"Deal '{doc['title']}' created with value {doc['value']}.",
        created_by,
    )
    return doc


def get_deal_by_id(deal_id):
    db = get_db()
    deal = db.deals.find_one({"_id": to_object_id(deal_id)})
    if not deal:
        raise NotFoundError("Deal not found.")
    return deal


def update_deal(deal_id, data, updated_by):
    db = get_db()
    existing = get_deal_by_id(deal_id)

    if "customer_id" in data:
        customer = db.customers.find_one({"_id": to_object_id(data["customer_id"])})
        if not customer:
            raise NotFoundError("Customer not found.")

    if "stage_id" in data:
        stage = db.pipeline_stages.find_one({"_id": to_object_id(data["stage_id"])})
        if not stage:
            raise NotFoundError("Pipeline stage not found.")

    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.deals.update_one({"_id": to_object_id(deal_id)}, {"$set": update_fields})
    updated = get_deal_by_id(deal_id)

    record_audit_log(
        updated_by,
        "update",
        "deal",
        deal_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_deal(deal_id, deleted_by):
    db = get_db()
    existing = get_deal_by_id(deal_id)
    db.deals.delete_one({"_id": to_object_id(deal_id)})
    record_audit_log(deleted_by, "delete", "deal", deal_id, changes={"deleted_doc": existing})


def move_deal_stage(deal_id, stage_id, updated_by):
    db = get_db()
    deal = get_deal_by_id(deal_id)
    stage = db.pipeline_stages.find_one({"_id": to_object_id(stage_id)})
    if not stage:
        raise NotFoundError("Pipeline stage not found.")

    old_stage_id = deal.get("stage_id")
    old_stage_name = "Unknown"
    if old_stage_id:
        old_stage = db.pipeline_stages.find_one({"_id": to_object_id(old_stage_id)})
        if old_stage:
            old_stage_name = old_stage.get("name")

    db.deals.update_one({"_id": to_object_id(deal_id)}, {"$set": {"stage_id": stage_id, "updated_at": utcnow()}})
    updated = get_deal_by_id(deal_id)

    record_audit_log(
        updated_by, "move_stage", "deal", deal_id, changes={"before_stage_id": old_stage_id, "after_stage_id": stage_id}
    )
    record_activity(
        "customer",
        deal["customer_id"],
        "deal_moved",
        f"Deal '{deal['title']}' moved from stage '{old_stage_name}' to '{stage['name']}'.",
        updated_by,
    )
    return updated
