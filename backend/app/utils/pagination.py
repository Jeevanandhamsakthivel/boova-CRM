"""
Pagination helpers shared by every list endpoint (Leads, Customers, Tasks,
Follow-Ups, Deals, Notifications, etc.) per the "Pagination" UI requirement
repeated across all module specs in the SRS.
"""
from flask import current_app, request


def get_pagination_params():
    """Read page/per_page from query string, clamp to configured bounds."""
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1

    default_size = current_app.config.get("DEFAULT_PAGE_SIZE", 20)
    max_size = current_app.config.get("MAX_PAGE_SIZE", 100)

    try:
        per_page = int(request.args.get("per_page", default_size))
    except (TypeError, ValueError):
        per_page = default_size

    per_page = max(1, min(per_page, max_size))
    skip = (page - 1) * per_page
    return page, per_page, skip


def build_pagination_meta(page, per_page, total_count):
    total_pages = (total_count + per_page - 1) // per_page if per_page else 0
    return {
        "page": page,
        "per_page": per_page,
        "total_count": total_count,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


def get_sort_params(allowed_fields, default_field="created_at", default_order="desc"):
    """Read sort_by/sort_order from query string, restricted to allowed_fields."""
    sort_by = request.args.get("sort_by", default_field)
    if sort_by not in allowed_fields:
        sort_by = default_field

    sort_order = request.args.get("sort_order", default_order).lower()
    direction = -1 if sort_order == "desc" else 1
    return sort_by, direction