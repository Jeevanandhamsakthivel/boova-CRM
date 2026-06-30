from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def create_ticket(data, created_by):
    db = get_db()
    doc = {
        "subject": data["subject"],
        "description": data.get("description"),
        "customer_id": data.get("customer_id"),
        "contact_email": data.get("contact_email"),
        "status": data.get("status", "new"),
        "priority": data.get("priority", "medium"),
        "channel": data.get("channel", "email"),
        "category": data.get("category"),
        "assigned_to": data.get("assigned_to"),
        "deal_id": data.get("deal_id"),
        "tags": data.get("tags", []),
        "replies": [],
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.tickets.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "ticket", str(doc["_id"]), changes=doc)
    if data.get("customer_id"):
        record_activity("customer", data["customer_id"], "ticket_created",
                        f"Support ticket '{doc['subject']}' created.", created_by)
    return doc


def get_ticket_by_id(ticket_id):
    db = get_db()
    ticket = db.tickets.find_one({"_id": to_object_id(ticket_id)})
    if not ticket:
        raise NotFoundError("Ticket not found.")
    return ticket


def list_tickets(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("priority"):
        query["priority"] = filters["priority"]
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("category"):
        query["category"] = filters["category"]

    total = db.tickets.count_documents(query)
    cursor = db.tickets.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_ticket(ticket_id, data, updated_by):
    db = get_db()
    existing = get_ticket_by_id(ticket_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.tickets.update_one({"_id": to_object_id(ticket_id)}, {"$set": update_fields})
    updated = get_ticket_by_id(ticket_id)

    record_audit_log(
        updated_by, "update", "ticket", ticket_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    if "status" in update_fields and update_fields["status"] != existing.get("status"):
        entity_type = "customer" if existing.get("customer_id") else "ticket"
        entity_id = existing.get("customer_id") or ticket_id
        record_activity(
            entity_type, entity_id, "ticket_status_change",
            f"Ticket '{existing['subject']}' changed to '{update_fields['status']}'.", updated_by,
        )
    return updated


def delete_ticket(ticket_id, deleted_by):
    db = get_db()
    existing = get_ticket_by_id(ticket_id)
    db.tickets.delete_one({"_id": to_object_id(ticket_id)})
    record_audit_log(deleted_by, "delete", "ticket", ticket_id, changes={"deleted_doc": existing})


def add_reply(ticket_id, body, is_internal, replied_by):
    db = get_db()
    ticket = get_ticket_by_id(ticket_id)
    reply = {
        "body": body,
        "is_internal": is_internal,
        "replied_by": replied_by,
        "created_at": utcnow(),
    }
    db.tickets.update_one(
        {"_id": to_object_id(ticket_id)},
        {"$push": {"replies": reply}, "$set": {"updated_at": utcnow()}},
    )
    if ticket.get("status") in ("new", "waiting_on_customer"):
        db.tickets.update_one(
            {"_id": to_object_id(ticket_id)},
            {"$set": {"status": "open", "updated_at": utcnow()}},
        )

    if not is_internal and ticket.get("customer_id"):
        record_activity(
            "customer", ticket["customer_id"], "ticket_reply",
            f"Reply added to ticket '{ticket['subject']}'.", replied_by,
        )
    return reply
