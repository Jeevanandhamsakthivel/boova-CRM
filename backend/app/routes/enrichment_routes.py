from flask import Blueprint, request, g
from app.services import smart_field_service, next_best_action_service
from app.utils.responses import success_response
from app.middlewares.auth_middleware import permission_required

enrich_bp = Blueprint("enrich", __name__, url_prefix="/api/enrich")


@enrich_bp.post("/auto-populate")
@permission_required("leads.create")
def auto_populate():
    body = request.get_json(force=True, silent=True) or {}
    record = body.get("record", {})
    enriched = smart_field_service.enrich_record(record)
    return success_response(enriched)


@enrich_bp.get("/next-best-action/<entity_type>/<entity_id>")
@permission_required("customers.read")
def next_best_action(entity_type, entity_id):
    suggestions = next_best_action_service.get_suggestions(entity_type, entity_id)
    return success_response(suggestions)
