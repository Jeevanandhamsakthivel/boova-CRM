"""
Generic helpers: ObjectId <-> str conversion, datetime serialization,
safe dict projection.
"""
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId


def is_valid_object_id(value):
    return ObjectId.is_valid(value) if value else False


def to_object_id(value):
    """Convert a string to ObjectId, raising ValueError on bad input."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise ValueError(f"Invalid ID format: {value}")


def serialize_doc(doc):
    """
    Recursively convert a MongoDB document (or list of documents) into
    JSON-serializable structures: ObjectId -> str, datetime -> ISO 8601.
    """
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            out_key = "id" if key == "_id" else key
            result[out_key] = serialize_doc(value)
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.astimezone(timezone.utc).isoformat()
    return doc


def utcnow():
    return datetime.now(timezone.utc)
