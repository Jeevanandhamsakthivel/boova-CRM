from flask import Blueprint, request, g
from marshmallow import ValidationError

from app.models.knowledge_base_schema import ArticleCreateSchema, ArticleUpdateSchema
from app.services import knowledge_base_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.helpers import serialize_doc
from app.utils.pagination import get_pagination_params, build_pagination_meta, get_sort_params
from app.middlewares.auth_middleware import permission_required

kb_bp = Blueprint("kb", __name__, url_prefix="/api/knowledge-base")
ALLOWED_SORT_FIELDS = ["created_at", "title", "status", "updated_at"]


@kb_bp.get("")
@permission_required("kb.read")
def list_articles():
    page, per_page, skip = get_pagination_params()
    sort_by, sort_direction = get_sort_params(ALLOWED_SORT_FIELDS)
    filters = {
        "status": request.args.get("status"),
        "category": request.args.get("category"),
        "visibility": request.args.get("visibility"),
        "search": request.args.get("search"),
    }
    articles, total = knowledge_base_service.list_articles(filters, skip, per_page, sort_by, sort_direction)
    return success_response(serialize_doc(articles), meta=build_pagination_meta(page, per_page, total))


@kb_bp.post("")
@permission_required("kb.create")
def create_article():
    try:
        data = ArticleCreateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    article = knowledge_base_service.create_article(data, g.current_user_id)
    return success_response(serialize_doc(article), message="Article created.", status_code=201)


@kb_bp.get("/<article_id>")
@permission_required("kb.read")
def get_article(article_id):
    try:
        article = knowledge_base_service.get_article_by_id(article_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(article))


@kb_bp.put("/<article_id>")
@permission_required("kb.update")
def update_article(article_id):
    try:
        data = ArticleUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))
    try:
        article = knowledge_base_service.update_article(article_id, data, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(serialize_doc(article), message="Article updated.")


@kb_bp.delete("/<article_id>")
@permission_required("kb.delete")
def delete_article(article_id):
    try:
        knowledge_base_service.delete_article(article_id, g.current_user_id)
    except (AppError, ValueError) as e:
        return error_response(str(e), getattr(e, "status_code", 400))
    return success_response(message="Article deleted.")
