"""
Service layer for Customer Management (SRS Chapter 12).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, ConflictError
from app.services.audit_service import record_audit_log, record_activity


def create_customer(data, created_by):
    db = get_db()
    existing = db.customers.find_one({"email": data["email"].lower()})
    if existing:
        raise ConflictError("A customer with this email already exists.")

    doc = {
        "name": data["name"],
        "email": data["email"].lower(),
        "phone": data.get("phone"),
        "company": data.get("company"),
        "status": data.get("status", "active"),
        "address": data.get("address", {}),
        "assigned_to": data.get("assigned_to"),
        "lifetime_value": data.get("lifetime_value", 0),
        "notes": data.get("notes"),
        "tags": data.get("tags", []),
        "source_lead_id": data.get("source_lead_id"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.customers.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "customer", str(doc["_id"]), changes=doc)
    record_activity("customer", str(doc["_id"]), "created", f"Customer '{doc['name']}' created.", created_by)
    return doc


def get_customer_by_id(customer_id):
    db = get_db()
    customer = db.customers.find_one({"_id": to_object_id(customer_id)})
    if not customer:
        raise NotFoundError("Customer not found.")
    return customer


def list_customers(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("search"):
        query["$text"] = {"$search": filters["search"]}

    total = db.customers.count_documents(query)
    cursor = db.customers.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_customer(customer_id, data, updated_by):
    db = get_db()
    existing = get_customer_by_id(customer_id)

    if "email" in data and data["email"]:
        data["email"] = data["email"].lower()
        dupe = db.customers.find_one({"email": data["email"], "_id": {"$ne": to_object_id(customer_id)}})
        if dupe:
            raise ConflictError("Another customer already uses this email.")

    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.customers.update_one({"_id": to_object_id(customer_id)}, {"$set": update_fields})
    updated = get_customer_by_id(customer_id)

    record_audit_log(
        updated_by, "update", "customer", customer_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_customer(customer_id, deleted_by):
    db = get_db()
    existing = get_customer_by_id(customer_id)
    db.customers.delete_one({"_id": to_object_id(customer_id)})
    record_audit_log(deleted_by, "delete", "customer", customer_id, changes={"deleted_doc": existing})