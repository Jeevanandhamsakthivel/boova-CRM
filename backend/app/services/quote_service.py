from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, ConflictError
from app.services.audit_service import record_audit_log, record_activity


def create_quote(data, created_by):
    db = get_db()
    doc = {
        "title": data["title"],
        "customer_id": data["customer_id"],
        "deal_id": data.get("deal_id"),
        "line_items": data.get("line_items", []),
        "subtotal": data.get("subtotal", 0),
        "tax_percent": data.get("tax_percent", 0),
        "tax_amount": data.get("tax_amount", 0),
        "total": data.get("total", 0),
        "currency": data.get("currency", "USD"),
        "status": data.get("status", "draft"),
        "valid_until": data.get("valid_until"),
        "notes": data.get("notes"),
        "terms": data.get("terms"),
        "assigned_to": data.get("assigned_to"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.quotes.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "quote", str(doc["_id"]), changes=doc)
    record_activity("customer", data["customer_id"], "quote_created",
                    f"Quote '{doc['title']}' created for {doc['total']} {doc['currency']}.", created_by)
    return doc


def get_quote_by_id(quote_id):
    db = get_db()
    quote = db.quotes.find_one({"_id": to_object_id(quote_id)})
    if not quote:
        raise NotFoundError("Quote not found.")
    return quote


def list_quotes(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]

    total = db.quotes.count_documents(query)
    cursor = db.quotes.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_quote(quote_id, data, updated_by):
    db = get_db()
    existing = get_quote_by_id(quote_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.quotes.update_one({"_id": to_object_id(quote_id)}, {"$set": update_fields})
    updated = get_quote_by_id(quote_id)

    record_audit_log(
        updated_by, "update", "quote", quote_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    if "status" in update_fields and update_fields["status"] != existing.get("status"):
        record_activity(
            "customer", existing["customer_id"], "quote_status_change",
            f"Quote '{existing['title']}' changed to '{update_fields['status']}'.", updated_by,
        )
    return updated


def delete_quote(quote_id, deleted_by):
    db = get_db()
    existing = get_quote_by_id(quote_id)
    db.quotes.delete_one({"_id": to_object_id(quote_id)})
    record_audit_log(deleted_by, "delete", "quote", quote_id, changes={"deleted_doc": existing})
