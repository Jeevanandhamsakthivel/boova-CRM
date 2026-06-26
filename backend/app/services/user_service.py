"""
Service layer for Users & Authentication (SRS Chapter 7: Authentication Module).
Encapsulates all MongoDB access for the `users` collection - per Chapter 26
(Service Layer Design): routes never touch pymongo directly.
"""
import bcrypt

from app.db import get_db
from app.utils.helpers import utcnow, to_object_id, serialize_doc
from app.utils.errors import ConflictError, NotFoundError, UnauthorizedError


def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_user(data):
    db = get_db()
    existing = db.users.find_one({"email": data["email"].lower()})
    if existing:
        raise ConflictError("A user with this email already exists.")

    doc = {
        "name": data["name"],
        "email": data["email"].lower(),
        "password_hash": hash_password(data["password"]),
        "role": data.get("role", "agent"),
        "phone": data.get("phone"),
        "status": "active",
        "avatar_url": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def authenticate_user(email, password):
    db = get_db()
    user = db.users.find_one({"email": email.lower()})
    if not user:
        raise UnauthorizedError("Invalid email or password.")
    if user.get("status") != "active":
        raise UnauthorizedError("This account is not active. Contact an administrator.")
    if not verify_password(password, user["password_hash"]):
        raise UnauthorizedError("Invalid email or password.")
    return user


def get_user_by_id(user_id):
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise NotFoundError("User not found.")
    return user


def get_user_by_email(email):
    db = get_db()
    return db.users.find_one({"email": email.lower()})


def list_users(filters, skip, limit, sort_by, sort_direction):
    db = get_db()
    query = {}
    if filters.get("role"):
        query["role"] = filters["role"]
    if filters.get("status"):
        query["status"] = filters["status"]
    if filters.get("search"):
        regex = {"$regex": filters["search"], "$options": "i"}
        query["$or"] = [{"name": regex}, {"email": regex}]

    total = db.users.count_documents(query)
    cursor = db.users.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    return list(cursor), total


def update_user_profile(user_id, data):
    db = get_db()
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()
    db.users.update_one({"_id": to_object_id(user_id)}, {"$set": update_fields})
    return get_user_by_id(user_id)


def admin_update_user(user_id, data):
    db = get_db()
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()
    result = db.users.update_one({"_id": to_object_id(user_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        raise NotFoundError("User not found.")
    return get_user_by_id(user_id)


def change_password(user_id, current_password, new_password):
    user = get_user_by_id(user_id)
    if not verify_password(current_password, user["password_hash"]):
        raise UnauthorizedError("Current password is incorrect.")
    db = get_db()
    db.users.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"password_hash": hash_password(new_password), "updated_at": utcnow()}},
    )


def deactivate_user(user_id):
    db = get_db()
    result = db.users.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"status": "inactive", "updated_at": utcnow()}},
    )
    if result.matched_count == 0:
        raise NotFoundError("User not found.")


def public_user(user_doc):
    """Strip sensitive fields before returning a user to the client."""
    safe = serialize_doc(user_doc)
    safe.pop("password_hash", None)
    return safe