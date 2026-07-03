"""
Email service — manages outbound/inbound email records in MongoDB and
delegates actual delivery to the SMTP service.
"""
import re
import logging
from bson.objectid import ObjectId
from flask import current_app

from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity
from app.services import smtp_service

logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _resolve_sender(sent_by):
    """Resolve a user ID to an email address. Falls back to the system sender."""
    try:
        db = get_db()
        user = db.users.find_one({"_id": to_object_id(sent_by)})
        if user and user.get("email"):
            return user["email"], user.get("name", "")
    except Exception:
        pass
    cfg = current_app.config
    return cfg.get("SMTP_FROM_EMAIL", "noreply@psmcrm.com"), cfg.get("SMTP_FROM_NAME", "PSM CRM")


def send_email(data, sent_by):
    """Send an email (via SMTP) and persist a record in MongoDB.

    Steps:
        1. Resolve sender address from user record.
        2. If a *template_id* is provided, load the template and merge variables.
        3. Deliver via ``smtp_service.send()`` with retry logic.
        4. Persist the outbound email document (including delivery status).
        5. Record audit log and activity timeline entry.

    Returns:
        dict: The persisted email document (with delivery metadata).
    """
    db = get_db()
    from_email, from_name = _resolve_sender(sent_by)

    body = data["body"]
    subject = data["subject"]

    # Template merge
    template_id = data.get("template_id")
    if template_id:
        try:
            tmpl = db.email_templates.find_one({"_id": to_object_id(template_id)})
            if tmpl:
                variables = data.get("template_vars") or {}
                subject = smtp_service.render_template(tmpl.get("subject", subject), variables)
                body = smtp_service.render_template(tmpl.get("body", body), variables)
        except Exception as exc:
            logger.warning("Template merge failed for %s: %s", template_id, exc)

    to_addrs = data["to"]
    cc = data.get("cc", [])
    bcc = data.get("bcc", [])

    # Deliver via SMTP (pass sent_by for per-user SMTP settings)
    attachments = data.get("attachments")  # list of {content, filename}
    result = smtp_service.send(
        to_addrs=to_addrs,
        subject=subject,
        body=body,
        cc=cc,
        bcc=bcc,
        attachments=attachments,
        variables=None,
        html=data.get("html", True),
        from_name=from_name,
        from_email=from_email,
        user_id=sent_by,
    )

    # Persist record
    doc = {
        "from": from_email,
        "from_name": from_name,
        "to": to_addrs,
        "cc": cc,
        "bcc": bcc,
        "subject": subject,
        "body": body,
        "direction": "outbound",
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "deal_id": data.get("deal_id"),
        "template_id": template_id,
        "sent_by": sent_by,
        "delivered": result["delivered"],
        "delivery_error": result.get("error"),
        "recipients_count": result.get("recipients_count", len(to_addrs)),
        "created_at": utcnow(),
    }
    db.emails.insert_one(doc)

    record_audit_log(
        sent_by, "email_send", "email", str(doc["_id"]),
        changes={"to": to_addrs, "subject": subject, "delivered": result["delivered"]},
    )
    entity_type = (
        "customer" if data.get("customer_id")
        else "lead" if data.get("lead_id")
        else None
    )
    entity_id = data.get("customer_id") or data.get("lead_id")
    if entity_type and entity_id:
        record_activity(
            entity_type, entity_id, "email_sent",
            f"Email {'delivered' if result['delivered'] else 'failed'}: '{subject}'",
            sent_by,
        )

    return doc


def list_emails(filters, skip, limit, sort_by="created_at", sort_direction=-1):
    """Paginated email listing with optional filters."""
    db = get_db()
    query = {}
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("lead_id"):
        query["lead_id"] = filters["lead_id"]
    if filters.get("direction"):
        query["direction"] = filters["direction"]
    if filters.get("q"):
        query["$or"] = [
            {"subject": {"$regex": filters["q"], "$options": "i"}},
            {"body": {"$regex": filters["q"], "$options": "i"}},
        ]
    total = db.emails.count_documents(query)
    cursor = db.emails.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def get_email(email_id):
    """Fetch a single email document by ID."""
    db = get_db()
    doc = db.emails.find_one({"_id": to_object_id(email_id)})
    if not doc:
        raise NotFoundError("Email not found.")
    return doc


def log_inbound_email(data):
    """Persist an inbound email (received via webhook or IMAP).

    Fields accepted: ``from``, ``to``, ``cc``, ``subject``, ``body``,
    ``message_id``, ``in_reply_to``, ``references``, ``customer_id``,
    ``lead_id``, ``attachments`` (list of dicts).
    """
    db = get_db()
    doc = {
        "from": data.get("from"),
        "from_name": data.get("from_name"),
        "to": data.get("to", []),
        "cc": data.get("cc", []),
        "subject": data.get("subject"),
        "body": data.get("body"),
        "direction": "inbound",
        "message_id": data.get("message_id"),
        "in_reply_to": data.get("in_reply_to"),
        "references": data.get("references"),
        "customer_id": data.get("customer_id"),
        "lead_id": data.get("lead_id"),
        "deal_id": data.get("deal_id"),
        "attachments": data.get("attachments", []),
        "created_at": utcnow(),
    }
    result = db.emails.insert_one(doc)
    return str(result.inserted_id)


def find_related_entity(email_from, email_body, subject):
    """Heuristic matching of an inbound email to a known customer or lead.

    Returns a tuple ``(entity_type, entity_id)`` or ``(None, None)``.
    """
    db = get_db()
    if email_from:
        customer = db.customers.find_one({"email": email_from.lower().strip()})
        if customer:
            return "customer", str(customer["_id"])
        lead = db.leads.find_one({"email": email_from.lower().strip()})
        if lead:
            return "lead", str(lead["_id"])
        company = db.companies.find_one({"email": email_from.lower().strip()})
        if company:
            return "company", str(company["_id"])
    return None, None


# ── Config helpers ──

def _get_webhook_secret():
    """Return the webhook shared secret from config, or empty string."""
    try:
        return current_app.config.get("EMAIL_WEBHOOK_SECRET", "")
    except RuntimeError:
        return ""


def _get_smtp_config_value(key, default=None):
    """Safely read a config value outside of request context."""
    try:
        return current_app.config.get(key, default)
    except RuntimeError:
        return default


def _get_webhook_url():
    """Return the public URL for the inbound email webhook."""
    try:
        host = current_app.config.get("EXTERNAL_URL", "http://localhost:5000")
        return f"{host.rstrip('/')}/api/email/webhook/inbound"
    except RuntimeError:
        return ""


# ── Email Templates (unchanged interface, extended) ──

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
