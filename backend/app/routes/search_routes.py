"""
Search Architecture routes (SRS Chapter 17).

GET /api/search?q=...
"""
from flask import Blueprint, request

from app.services import search_service
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import jwt_required_custom

search_bp = Blueprint("search", __name__, url_prefix="/api/search")


@search_bp.get("")
@jwt_required_custom()
def search():
    query_text = request.args.get("q", "").strip()
    if not query_text:
        return error_response("Query parameter 'q' is required.", 422)

    results = search_service.global_search(query_text)
    return success_response(serialize_doc(results))