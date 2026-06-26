"""
Sales Pipeline Module routes (SRS Chapter 16).

GET    /api/pipeline/stages
POST   /api/pipeline/stages
PUT    /api/pipeline/stages/<id>
DELETE /api/pipeline/stages/<id>
GET    /api/pipeline/board        (Kanban summary)

GET    /api/deals
POST   /api/deals
GET    /api/deals/<id>
PUT    /api/deals/<id>
DELETE /api/deals/<id>
POST   /api/deals/<id>/move
"""
from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.deal_schema import (
    PipelineStageCreateSchema,
    PipelineStageUpdateSchema,
    DealCreateSchema,
    DealUpdateSchema,
    DealMoveStageSchema,
)
from app.services import deal_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required, admin_required

pipeline_bp = Blueprint("pipeline", __name__, url_prefix="/api/pipeline")
deals_bp = Blueprint("deals", __name__, url_prefix="/api/deals")

ALLOWED_SORT_FIELDS = ["created_at", "value", "status", "updated_at"]


def _scope_for_role():
    if g.current_user_role == "agent":
        return g.current_user_id
    return None


# ---------- Pipeline Stages ----------

@pipeline_bp.get("/stages")
@permission_required("deals.read")
def list_stages():
    stages = deal_service.list_stages()
    return success_response(serialize_doc(stages))


@pipeline_bp.post("/stages")
@admin_required
def create_stage():
    try:
        data = PipelineStageCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        stage = deal_service.create_stage(data, g.current_user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)

    return success_response(serialize_doc(stage), message="Pipeline stage created.", status_code=201)


@pipeline_bp.put("/stages/<stage_id>")
@admin_required
def update_stage(stage_id):
    try:
        data = PipelineStageUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        stage = deal_service.update_stage(stage_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(stage), message="Pipeline stage updated.")


@pipeline_bp.delete("/stages/<stage_id>")
@admin_required
def delete_stage(stage_id):
    try:
        deal_service.delete_stage(stage_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Pipeline stage deleted.")


@pipeline_bp.get("/board")
@permission_required("deals.read")
def pipeline_board():
    summary = deal_service.get_pipeline_summary()
    return success_response(serialize_doc(summary))


# ---------- Deals ----------

@deals_bp.get("")
@permission_required("deals.read")
def list_deals():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)

    filters = {
        "stage_id": request.args.get("stage_id"),
        "status": request.args.get("status"),
        "customer_id": request.args.get("customer_id"),
        "assigned_to": request.args.get("assigned_to"),
    }
    deals, total = deal_service.list_deals(
        filters, skip, per_page, sort_by, sort_direction, scope_user_id=_scope_for_role()
    )
    meta = build_pagination_meta(page, per_page, total)
    return success_response(serialize_doc(deals), meta=meta)


@deals_bp.post("")
@permission_required("deals.create")
def create_deal():
    try:
        data = DealCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    deal = deal_service.create_deal(data, g.current_user_id)
    return success_response(serialize_doc(deal), message="Deal created.", status_code=201)


@deals_bp.get("/<deal_id>")
@permission_required("deals.read")
def get_deal(deal_id):
    try:
        deal = deal_service.get_deal_by_id(deal_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(deal))


@deals_bp.put("/<deal_id>")
@permission_required("deals.update")
def update_deal(deal_id):
    try:
        data = DealUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        deal = deal_service.update_deal(deal_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(deal), message="Deal updated.")


@deals_bp.delete("/<deal_id>")
@permission_required("deals.delete")
def delete_deal(deal_id):
    try:
        deal_service.delete_deal(deal_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Deal deleted.")


@deals_bp.post("/<deal_id>/move")
@permission_required("deals.update")
def move_deal(deal_id):
    try:
        data = DealMoveStageSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        deal = deal_service.move_deal_stage(deal_id, data["stage_id"], g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))

    return success_response(serialize_doc(deal), message="Deal moved.")