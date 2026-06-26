"""
Service layer for Settings Module (SRS Chapter 20).
"""
from app.db import get_db
from app.utils.helpers import utcnow
from app.utils.errors import NotFoundError


def upsert_setting(data, updated_by):
    db = get_db()
    scope = data.get("scope", "global")
    scope_id = data.get("scope_id")
    query = {"key": data["key"], "scope": scope, "scope_id": scope_id}

    db.settings.update_one(
        query,
        {
            "$set": {
                "value": data["value"],
                "updated_by": updated_by,
                "updated_at": utcnow(),
            },
            "$setOnInsert": {"created_at": utcnow()},
        },
        upsert=True,
    )
    return db.settings.find_one(query)


def get_setting(key, scope="global", scope_id=None):
    db = get_db()
    setting = db.settings.find_one({"key": key, "scope": scope, "scope_id": scope_id})
    if not setting:
        raise NotFoundError(f"Setting '{key}' not found.")
    return setting


def list_settings(scope=None, scope_id=None):
    db = get_db()
    query = {}
    if scope:
        query["scope"] = scope
    if scope_id:
        query["scope_id"] = scope_id
    return list(db.settings.find(query))


def delete_setting(key, scope="global", scope_id=None):
    db = get_db()
    result = db.settings.delete_one({"key": key, "scope": scope, "scope_id": scope_id})
    if result.deleted_count == 0:
        raise NotFoundError(f"Setting '{key}' not found.")