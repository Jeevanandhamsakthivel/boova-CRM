"""
Service layer for Lead Management (SRS Chapter 10) and Lead Qualification
Workflow (SRS Chapter 11).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, ConflictError
from app.services.audit_service import record_audit_log, record_activity
from app.services.customer_service import create_customer
from app.services.deal_service import create_deal


def create_lead(data, created_by):
    db = get_db()
    doc = {
        "name": data["name"],
        "email": data.get("email"),
        "phone": data.get("phone"),
        "company": data.get("company"),
        "job_title": data.get("job_title"),
        "source": data.get("source", "other"),
        "status": data.get("status", "new"),
        "qualification": data.get("qualification"),
        "estimated_value": data.get("estimated_value", 0),
        "assigned_to": data.get("assigned_to"),
        "notes": data.get("notes"),
        "tags": data.get("tags", []),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.leads.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "lead", str(doc["_id"]), changes=doc)
    record_activity("lead", str(doc["_id"]), "created", f"Lead '{doc['name']}' created.", created_by)
    return doc


def get_lead_by_id(lead_id):
    db = get_db()
    lead = db.leads.find_one({"_id": to_object_id(lead_id)})
    if not lead:
        raise NotFoundError("Lead not found.")
    return lead


def list_leads(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("source"):
        query["source"] = filters["source"]
    if filters.get("qualification"):
        query["qualification"] = filters["qualification"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("search"):
        query["$text"] = {"$search": filters["search"]}

    total = db.leads.count_documents(query)
    cursor = db.leads.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_lead(lead_id, data, updated_by):
    db = get_db()
    existing = get_lead_by_id(lead_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.leads.update_one({"_id": to_object_id(lead_id)}, {"$set": update_fields})
    updated = get_lead_by_id(lead_id)

    record_audit_log(
        updated_by, "update", "lead", lead_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    if "status" in update_fields and update_fields["status"] != existing.get("status"):
        record_activity(
            "lead", lead_id, "status_change",
            f"Status changed from '{existing.get('status')}' to '{update_fields['status']}'.",
            updated_by,
        )
    return updated


def delete_lead(lead_id, deleted_by):
    db = get_db()
    existing = get_lead_by_id(lead_id)
    db.leads.delete_one({"_id": to_object_id(lead_id)})
    record_audit_log(deleted_by, "delete", "lead", lead_id, changes={"deleted_doc": existing})


def convert_lead_to_customer(lead_id, options, converted_by):
    """
    Lead Qualification Workflow: convert a lead into a Customer record,
    optionally creating an initial Deal in the pipeline.
    """
    db = get_db()
    lead = get_lead_by_id(lead_id)

    if lead["status"] == "converted":
        raise ConflictError("This lead has already been converted.")

    if not lead.get("email"):
        raise ConflictError("Lead must have an email before conversion.")

    customer_doc = create_customer(
        {
            "name": lead["name"],
            "email": lead["email"],
            "phone": lead.get("phone"),
            "company": lead.get("company"),
            "status": "active",
            "address": {},
            "assigned_to": lead.get("assigned_to"),
            "lifetime_value": 0,
            "notes": lead.get("notes"),
            "tags": lead.get("tags", []),
            "source_lead_id": lead_id,
        },
        created_by=converted_by,
    )

    deal_doc = None
    if options.get("create_deal"):
        first_stage = db.pipeline_stages.find_one(sort=[("order", 1)])
        if first_stage:
            deal_doc = create_deal(
                {
                    "title": options.get("deal_title") or f"Deal for {lead['name']}",
                    "customer_id": str(customer_doc["_id"]),
                    "stage_id": str(first_stage["_id"]),
                    "value": options.get("deal_value") or lead.get("estimated_value", 0),
                    "status": "open",
                    "assigned_to": lead.get("assigned_to") or converted_by,
                },
                created_by=converted_by,
            )

    db.leads.update_one(
        {"_id": to_object_id(lead_id)},
        {"$set": {"status": "converted", "updated_at": utcnow()}},
    )

    record_audit_log(
        converted_by, "convert", "lead", lead_id,
        changes={"converted_to_customer_id": str(customer_doc["_id"])},
    )
    record_activity(
        "lead", lead_id, "converted",
        f"Lead converted to customer '{customer_doc['name']}'.", converted_by,
    )

    return customer_doc, deal_doc