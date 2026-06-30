from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def send_message(data, sent_by):
    db = get_db()
    doc = {
        "to": data["to"],
        "message": data["message"],
        "direction": "outbound",
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "template_name": data.get("template_name"),
        "sent_by": sent_by,
        "status": "sent",
        "created_at": utcnow(),
    }
    result = db.whatsapp_messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(sent_by, "create", "whatsapp", str(doc["_id"]), changes={"to": data["to"]})
    entity_type = "customer" if data.get("customer_id") else "lead" if data.get("lead_id") else None
    entity_id = data.get("customer_id") or data.get("lead_id")
    if entity_type and entity_id:
        record_activity(entity_type, entity_id, "whatsapp_sent",
                        f"WhatsApp sent to {data['to']}", sent_by)
    return doc


def list_messages(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("lead_id"):
        query["lead_id"] = filters["lead_id"]
    if filters.get("direction"):
        query["direction"] = filters["direction"]

    total = db.whatsapp_messages.count_documents(query)
    cursor = db.whatsapp_messages.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total


def log_inbound_message(data):
    db = get_db()
    doc = {
        "from": data.get("from"),
        "message": data.get("message"),
        "direction": "inbound",
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "status": "received",
        "created_at": utcnow(),
    }
    result = db.whatsapp_messages.insert_one(doc)
    return str(result.inserted_id)


def create_lead_from_whatsapp(number, message):
    """WhatsApp-First Lead Capture (7.3)"""
    db = get_db()
    existing = db.leads.find_one({"phone": number})
    if existing:
        return existing

    lead = {
        "name": number,
        "phone": number,
        "source": "whatsapp",
        "status": "new",
        "notes": f"Auto-created from WhatsApp message: {message[:200]}",
        "tags": ["whatsapp"],
        "created_by": "system",
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.leads.insert_one(lead)
    lead["_id"] = result.inserted_id
    record_activity("lead", str(lead["_id"]), "created",
                    f"Lead auto-created from WhatsApp number {number}.", "system")
    return lead
