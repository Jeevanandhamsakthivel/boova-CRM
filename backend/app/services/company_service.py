from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError, ConflictError
from app.services.audit_service import record_audit_log, record_activity


def create_company(data, created_by):
    db = get_db()
    existing = db.companies.find_one({"name": data["name"]})
    if existing:
        raise ConflictError("A company with this name already exists.")

    doc = {
        "name": data["name"],
        "domain": data.get("domain"),
        "industry": data.get("industry"),
        "company_size": data.get("company_size"),
        "status": data.get("status", "active"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "website": data.get("website"),
        "linkedin_url": data.get("linkedin_url"),
        "annual_revenue": data.get("annual_revenue", 0),
        "description": data.get("description"),
        "assigned_to": data.get("assigned_to"),
        "tags": data.get("tags", []),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.companies.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "company", str(doc["_id"]), changes=doc)
    return doc


def get_company_by_id(company_id):
    db = get_db()
    company = db.companies.find_one({"_id": to_object_id(company_id)})
    if not company:
        raise NotFoundError("Company not found.")
    return company


def list_companies(filters, skip, limit, sort_by, sort_direction, scope_user_id=None):
    db = get_db()
    query = {}
    if scope_user_id:
        query["assigned_to"] = scope_user_id
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("industry"):
        query["industry"] = filters["industry"]
    if filters.get("assigned_to"):
        query["assigned_to"] = filters["assigned_to"]
    if filters.get("search"):
        query["$text"] = {"$search": filters["search"]}

    total = db.companies.count_documents(query)
    cursor = db.companies.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_company(company_id, data, updated_by):
    db = get_db()
    existing = get_company_by_id(company_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.companies.update_one({"_id": to_object_id(company_id)}, {"$set": update_fields})
    updated = get_company_by_id(company_id)

    record_audit_log(
        updated_by, "update", "company", company_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_company(company_id, deleted_by):
    db = get_db()
    existing = get_company_by_id(company_id)
    db.companies.delete_one({"_id": to_object_id(company_id)})
    record_audit_log(deleted_by, "delete", "company", company_id, changes={"deleted_doc": existing})
