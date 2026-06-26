"""
Service layer for Notification System (SRS Chapter 18).
"""
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError


def create_notification(data):
    db = get_db()
    doc = {
        "user_id": data["user_id"],
        "type": data["type"],
        "title": data["title"],
        "message": data["message"],
        "link": data.get("link"),
        "is_read": False,
        "created_at": utcnow(),
    }
    result = db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def list_notifications_for_user(user_id, skip, limit, unread_only=False):
    db = get_db()
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    total = db.notifications.count_documents(query)
    unread_count = db.notifications.count_documents({"user_id": user_id, "is_read": False})
    cursor = db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return list(cursor), total, unread_count


def mark_notification_read(notification_id, user_id, is_read=True):
    db = get_db()
    result = db.notifications.update_one(
        {"_id": to_object_id(notification_id), "user_id": user_id},
        {"$set": {"is_read": is_read}},
    )
    if result.matched_count == 0:
        raise NotFoundError("Notification not found.")
    return db.notifications.find_one({"_id": to_object_id(notification_id)})


def mark_all_read(user_id):
    db = get_db()
    db.notifications.update_many({"user_id": user_id, "is_read": False}, {"$set": {"is_read": True}})


def delete_notification(notification_id, user_id):
    db = get_db()
    result = db.notifications.delete_one({"_id": to_object_id(notification_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise NotFoundError("Notification not found.")