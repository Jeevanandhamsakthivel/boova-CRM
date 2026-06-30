"""Enhanced migration routes for competitor import (1.1), parallel-run mode (1.2),
reversible trial export (1.4), and field equivalency map (1.3)."""
from flask import Blueprint, request, g
from app.services import migration_service, data_export_service, smart_field_service
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required, admin_required

migration_enhanced_bp = Blueprint("migration_enhanced", __name__, url_prefix="/api/migration")

EQUIVALENCY_MAP = {
    "zoho": {
        "Leads": "leads", "Contacts": "customers", "Accounts": "companies",
        "Deals": "deals", "Tasks": "tasks", "Invoices": "invoices",
        "Quotes": "quotes", "Products": "products",
    },
    "salesforce": {
        "Lead": "leads", "Contact": "customers", "Account": "companies",
        "Opportunity": "deals", "Task": "tasks", "Order": "invoices",
        "Quote": "quotes", "Product2": "products", "Case": "tickets",
    },
    "hubspot": {
        "contact": "customers", "company": "companies", "deal": "deals",
        "ticket": "tickets", "task": "tasks", "quote": "quotes",
        "line_item": "line_items", "product": "products",
    },
}


@migration_enhanced_bp.get("/equivalency/<source>")
@permission_required("migration.read")
def get_equivalency(source):
    """Return field/module equivalency map for a competitor source (1.3)."""
    source = source.lower()
    if source not in EQUIVALENCY_MAP:
        return error_response(f"No equivalency map for '{source}'. Supported: {list(EQUIVALENCY_MAP.keys())}", 400)
    return success_response(EQUIVALENCY_MAP[source], message=f"Equivalency map for {source.title()}")


@migration_enhanced_bp.post("/import")
@admin_required
def import_from_competitor():
    """One-click migration import from competitor JSON payload (1.1)."""
    body = request.get_json(force=True, silent=True) or {}
    source = body.get("source", "").lower()
    records = body.get("records", [])
    target_type = body.get("target_type", "leads")

    if source not in EQUIVALENCY_MAP:
        return error_response(f"Unsupported source: {source}", 400)

    cleaned = migration_service.clean_import_payload(records)

    for record in cleaned:
        enriched = smart_field_service.enrich_record(record)
        record.update(enriched)

    from app.db import get_db
    db = get_db()
    collection = db[target_type]
    inserted = 0
    skipped = 0

    for record in cleaned:
        record["created_by"] = g.current_user_id
        record["created_at"] = record.get("created_at")
        record["updated_at"] = record.get("updated_at")
        record["source_import"] = source
        try:
            collection.insert_one(record)
            inserted += 1
        except Exception:
            skipped += 1

    return success_response({
        "inserted": inserted,
        "skipped": skipped,
        "total": len(cleaned),
    }, message=f"Import from {source} completed.")


@migration_enhanced_bp.get("/competitors")
@permission_required("migration.read")
def list_supported_competitors():
    """List supported competitor CRMs for migration."""
    competitors = [
        {"id": "zoho", "name": "Zoho CRM", "icon": "zoho"},
        {"id": "salesforce", "name": "Salesforce", "icon": "salesforce"},
        {"id": "hubspot", "name": "HubSpot", "icon": "hubspot"},
    ]
    return success_response(competitors)
