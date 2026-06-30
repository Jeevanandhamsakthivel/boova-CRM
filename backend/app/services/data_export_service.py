"""Data export service for reversible trial / full data export (1.4)."""
import csv
import io
import json
from datetime import datetime, timezone

from app.db import get_db
from app.utils.helpers import serialize_doc


def export_all_data(organization_id):
    """Export all CRM data for a given organization as a structured dict."""
    db = get_db()
    export = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "organization": organization_id,
        "data": {},
    }

    collections = [
        "leads", "customers", "companies", "deals", "tasks",
        "followups", "quotes", "invoices", "payments", "tickets",
        "kb_articles", "meetings", "emails", "whatsapp_messages",
        "activities", "notifications", "files",
    ]

    for collection_name in collections:
        cursor = db[collection_name].find({})
        docs = serialize_doc(list(cursor))
        export["data"][collection_name] = docs

    return export


def export_collection_csv(collection_name, filters=None):
    """Export a collection as CSV text."""
    db = get_db()
    query = filters or {}
    docs = list(db[collection_name].find(query))

    if not docs:
        return ""

    output = io.StringIO()
    fieldnames = list(docs[0].keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for doc in docs:
        row = {}
        for key in fieldnames:
            val = doc.get(key)
            if isinstance(val, (dict, list)):
                val = json.dumps(val, default=str)
            elif hasattr(val, "isoformat"):
                val = val.isoformat()
            elif not isinstance(val, (str, int, float, bool)):
                val = str(val) if val is not None else ""
            row[key] = val
        writer.writerow(row)

    return output.getvalue()
