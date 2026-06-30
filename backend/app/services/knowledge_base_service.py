from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log


def create_article(data, created_by):
    db = get_db()
    doc = {
        "title": data["title"],
        "content": data.get("content", ""),
        "category": data.get("category"),
        "status": data.get("status", "draft"),
        "visibility": data.get("visibility", "internal"),
        "tags": data.get("tags", []),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.kb_articles.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(created_by, "create", "kb_article", str(doc["_id"]), changes=doc)
    return doc


def get_article_by_id(article_id):
    db = get_db()
    article = db.kb_articles.find_one({"_id": to_object_id(article_id)})
    if not article:
        raise NotFoundError("Article not found.")
    return article


def list_articles(filters, skip, limit, sort_by, sort_direction):
    db = get_db()
    query = {}
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("category"):
        query["category"] = filters["category"]
    if filters.get("visibility"):
        query["visibility"] = filters["visibility"]
    if filters.get("search"):
        query["$text"] = {"$search": filters["search"]}

    total = db.kb_articles.count_documents(query)
    cursor = db.kb_articles.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_article(article_id, data, updated_by):
    db = get_db()
    existing = get_article_by_id(article_id)
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    db.kb_articles.update_one({"_id": to_object_id(article_id)}, {"$set": update_fields})
    updated = get_article_by_id(article_id)

    record_audit_log(
        updated_by, "update", "kb_article", article_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_article(article_id, deleted_by):
    db = get_db()
    existing = get_article_by_id(article_id)
    db.kb_articles.delete_one({"_id": to_object_id(article_id)})
    record_audit_log(deleted_by, "delete", "kb_article", article_id, changes={"deleted_doc": existing})
