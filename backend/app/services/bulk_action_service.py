"""Bulk action service (6.7) for performing operations on multiple records."""
from datetime import datetime, timezone
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.services.audit_service import record_audit_log, record_activity


def bulk_update(collection_name, record_ids, update_data, updated_by, scope_user_id=None):
    """Update multiple records in a collection."""
    db = get_db()
    object_ids = [to_object_id(oid) for oid in record_ids]
    query = {"_id": {"$in": object_ids}}
    if scope_user_id:
        query["assigned_to"] = scope_user_id

    update_fields = {k: v for k, v in update_data.items() if v is not None}
    update_fields["updated_at"] = utcnow()

    result = db[collection_name].update_many(query, {"$set": update_fields})

    for oid in object_ids:
        record_audit_log(updated_by, "bulk_update", collection_name, str(oid), changes=update_fields)

    return result.modified_count


def bulk_assign(collection_name, record_ids, new_owner, updated_by, scope_user_id=None):
    """Reassign multiple records to a new owner."""
    return bulk_update(collection_name, record_ids, {"assigned_to": new_owner}, updated_by, scope_user_id)


def bulk_delete(collection_name, record_ids, deleted_by, scope_user_id=None):
    """Delete multiple records."""
    db = get_db()
    object_ids = [to_object_id(oid) for oid in record_ids]
    query = {"_id": {"$in": object_ids}}
    if scope_user_id:
        query["assigned_to"] = scope_user_id

    result = db[collection_name].delete_many(query)

    for oid in object_ids:
        record_audit_log(deleted_by, "bulk_delete", collection_name, str(oid))

    return result.deleted_count


def bulk_add_tags(collection_name, record_ids, tags, updated_by, scope_user_id=None):
    """Add tags to multiple records."""
    db = get_db()
    object_ids = [to_object_id(oid) for oid in record_ids]
    query = {"_id": {"$in": object_ids}}
    if scope_user_id:
        query["assigned_to"] = scope_user_id

    result = db[collection_name].update_many(query, {"$addToSet": {"tags": {"$each": tags}}})
    return result.modified_count


def bulk_remove_tags(collection_name, record_ids, tags, updated_by, scope_user_id=None):
    """Remove tags from multiple records."""
    db = get_db()
    object_ids = [to_object_id(oid) for oid in record_ids]
    query = {"_id": {"$in": object_ids}}
    if scope_user_id:
        query["assigned_to"] = scope_user_id

    result = db[collection_name].update_many(query, {"$pull": {"tags": {"$in": tags}}})
    return result.modified_count
