from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity


def _generate_invoice_number(db):
    count = db.invoices.count_documents({}) + 1
    return f"INV-{count:05d}"


def create_invoice(data, created_by):
    db = get_db()
    doc = {
        "invoice_number": data.get("invoice_number") or _generate_invoice_number(db),
        "customer_id": data["customer_id"],
        "quote_id": data.get("quote_id"),
        "deal_id": data.get("deal_id"),
        "line_items": data.get("line_items", []),
        "subtotal": data.get("subtotal", 0),
        "tax_percent": data.get("tax_percent", 0),
        "tax_amount": data.get("tax_amount", 0),
        "total": data.get("total", 0),
        "amount_paid": data.get("amount_paid", 0),
        "balance_due": data.get("balance_due", 0),
        "currency": data.get("currency", "USD"),
        "status": data.get("status", "draft"),
        "issue_date": data.get("issue_date") or utcnow(),
        "due_date": data.get("due_date"),
        "payment_link": data.get("payment_link"),
        "notes": data.get("notes"),
        "terms": data.get("terms"),
        "assigned_to": data.get("assigned_to"),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.invoices.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "invoice", str(doc["_id"]), changes=doc)
    record_activity("customer", data["customer_id"], "invoice_created",
                    f"Invoice #{doc['invoice_number']} created for {doc['total']} {doc['currency']}.", created_by)
    return doc


def get_invoice_by_id(invoice_id):
    db = get_db()
    invoice = db.invoices.find_one({"_id": to_object_id(invoice_id)})
    if not invoice:
        raise NotFoundError("Invoice not found.")
    return invoice


def list_invoices(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
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

    total = db.invoices.count_documents(query)
    cursor = db.invoices.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_invoice(invoice_id, data, updated_by):
    db = get_db()
    existing = get_invoice_by_id(invoice_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.invoices.update_one({"_id": to_object_id(invoice_id)}, {"$set": update_fields})
    updated = get_invoice_by_id(invoice_id)

    record_audit_log(
        updated_by, "update", "invoice", invoice_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_invoice(invoice_id, deleted_by):
    db = get_db()
    existing = get_invoice_by_id(invoice_id)
    db.invoices.delete_one({"_id": to_object_id(invoice_id)})
    record_audit_log(deleted_by, "delete", "invoice", invoice_id, changes={"deleted_doc": existing})


def record_payment(data, created_by):
    db = get_db()
    invoice = get_invoice_by_id(data["invoice_id"])

    payment = {
        "invoice_id": data["invoice_id"],
        "amount": data["amount"],
        "method": data["method"],
        "transaction_id": data.get("transaction_id"),
        "status": data.get("status", "completed"),
        "notes": data.get("notes"),
        "created_by": created_by,
        "created_at": utcnow(),
    }
    result = db.payments.insert_one(payment)
    payment["_id"] = result.inserted_id

    new_amount_paid = (invoice.get("amount_paid", 0) or 0) + data["amount"]
    new_balance = max(0, invoice.get("total", 0) - new_amount_paid)
    new_status = "paid" if new_balance <= 0 else "partial"

    db.invoices.update_one(
        {"_id": to_object_id(data["invoice_id"])},
        {"$set": {"amount_paid": new_amount_paid, "balance_due": new_balance, "status": new_status, "updated_at": utcnow()}},
    )

    record_audit_log(created_by, "create", "payment", str(payment["_id"]), changes=payment)
    record_activity("customer", invoice["customer_id"], "payment_received",
                    f"Payment of {data['amount']} received for invoice #{invoice['invoice_number']}.", created_by)
    return payment
