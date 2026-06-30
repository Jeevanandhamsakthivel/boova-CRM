from flask import Blueprint, request, Response
from app.services import data_export_service
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import admin_required

export_bp = Blueprint("export", __name__, url_prefix="/api/export")


@export_bp.get("/all")
@admin_required
def export_all():
    org_id = request.args.get("organization_id", "default")
    data = data_export_service.export_all_data(org_id)
    return success_response(data, message="Export complete.")


@export_bp.get("/csv/<collection_name>")
@admin_required
def export_csv(collection_name):
    allowed = ["leads", "customers", "companies", "deals", "tasks", "followups",
               "quotes", "invoices", "payments", "tickets", "kb_articles", "meetings"]
    if collection_name not in allowed:
        return error_response(f"Collection '{collection_name}' is not exportable.", 400)

    csv_text = data_export_service.export_collection_csv(collection_name)
    return Response(
        csv_text,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={collection_name}.csv"},
    )
