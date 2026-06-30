"""
Service layer for customer file attachments.
Files are stored on the local filesystem under UPLOAD_FOLDER,
keyed by a UUID-based storage_key.
"""
import os
import uuid
from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log, record_activity

ALLOWED_MIMETYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "text/csv",
    "application/octet-stream",  # fallback for some CSV uploads
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def list_files(customer_id):
    db = get_db()
    files = list(db.files.find({"customer_id": customer_id}).sort("created_at", -1))
    return files


def save_file(customer_id, file_storage, uploaded_by, upload_folder):
    """
    file_storage: werkzeug FileStorage object
    upload_folder: absolute path to store files
    """
    # Server-side size check (client also validates)
    file_storage.seek(0, 2)
    size = file_storage.tell()
    file_storage.seek(0)

    if size > MAX_FILE_SIZE:
        from app.utils.errors import AppError
        raise AppError("File exceeds the 25 MB limit.", 400)

    mimetype = file_storage.mimetype or "application/octet-stream"

    storage_key = f"{uuid.uuid4().hex}_{file_storage.filename}"
    os.makedirs(upload_folder, exist_ok=True)
    dest_path = os.path.join(upload_folder, storage_key)
    file_storage.save(dest_path)

    db = get_db()
    doc = {
        "customer_id": customer_id,
        "filename": file_storage.filename,
        "mimetype": mimetype,
        "size_bytes": size,
        "storage_key": storage_key,
        "uploaded_by": uploaded_by,
        "created_at": utcnow(),
    }
    result = db.files.insert_one(doc)
    doc["_id"] = result.inserted_id

    record_audit_log(uploaded_by, "create", "file", str(doc["_id"]), changes={"filename": doc["filename"]})
    record_activity(
        "customer", customer_id, "file_uploaded",
        f"File '{doc['filename']}' uploaded.", uploaded_by,
    )
    return doc


def delete_file(file_id, deleted_by, upload_folder):
    db = get_db()
    file_doc = db.files.find_one({"_id": to_object_id(file_id)})
    if not file_doc:
        raise NotFoundError("File not found.")

    # Remove from filesystem
    dest_path = os.path.join(upload_folder, file_doc["storage_key"])
    if os.path.exists(dest_path):
        os.remove(dest_path)

    db.files.delete_one({"_id": to_object_id(file_id)})

    record_audit_log(deleted_by, "delete", "file", file_id, changes={"filename": file_doc["filename"]})
    record_activity(
        "customer", file_doc["customer_id"], "file_deleted",
        f"File '{file_doc['filename']}' deleted.", deleted_by,
    )


def get_file_path(storage_key, upload_folder):
    """Return the absolute filesystem path for a storage_key."""
    return os.path.join(upload_folder, storage_key)
