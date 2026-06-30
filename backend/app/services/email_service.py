from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def send_email(data, sent_by):
    db = get_db()
    doc = {
        "from": sent_by,
        "to": data["to"],
        "cc": data.get("cc", []),
        "bcc": data.get("bcc", []),
        "subject": data["subject"],
        "body": data["body"],
        "direction": "outbound",
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "deal_id": data.get("deal_id"),
        "sent_by": sent_by,
        "created_at": utcnow(),
    }
    result = db.emails.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(sent_by, "create", "email", str(doc["_id"]), changes={"to": data["to"], "subject": data["subject"]})
    entity_type = "customer" if data.get("customer_id") else "lead" if data.get("lead_id") else None
    entity_id = data.get("customer_id") or data.get("lead_id")
    if entity_type and entity_id:
        record_activity(entity_type, entity_id, "email_sent",
                        f"Email sent: '{data['subject']}'", sent_by)
    return doc


def list_emails(filters, skip, limit, sort_by="created_at", sort_direction=-1):
    db = get_db()
    query = {}
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("lead_id"):
        query["lead_id"] = filters["lead_id"]
    if filters.get("direction"):
        query["direction"] = filters["direction"]

    total = db.emails.count_documents(query)
    cursor = db.emails.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def log_inbound_email(data):
    db = get_db()
    doc = {
        "from": data.get("from"),
        "to": data.get("to", []),
        "cc": data.get("cc", []),
        "subject": data.get("subject"),
        "body": data.get("body"),
        "direction": "inbound",
        "message_id": data.get("message_id"),
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "created_at": utcnow(),
    }
    result = db.emails.insert_one(doc)
    return str(result.inserted_id)


# --- Email Templates ---

def create_template(data, created_by):
    db = get_db()
    doc = {
        "name": data["name"],
        "subject": data["subject"],
        "body": data["body"],
        "category": data.get("category"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.email_templates.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def list_templates(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("category"):
        query["category"] = filters["category"]
    total = db.email_templates.count_documents(query)
    cursor = db.email_templates.find(query).sort("name", 1).skip(skip).limit(limit)
    return list(cursor), total


def update_template(template_id, data, updated_by):
    db = get_db()
    existing = db.email_templates.find_one({"_id": to_object_id(template_id)})
    if not existing:
        raise NotFoundError("Template not found.")
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()
    db.email_templates.update_one({"_id": to_object_id(template_id)}, {"$set": update_fields})
    return db.email_templates.find_one({"_id": to_object_id(template_id)})


def delete_template(template_id, deleted_by):
    db = get_db()
    result = db.email_templates.delete_one({"_id": to_object_id(template_id)})
    if result.deleted_count == 0:
        raise NotFoundError("Template not found.")
