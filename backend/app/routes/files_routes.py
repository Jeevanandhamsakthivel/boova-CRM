"""
Customer file attachment routes.

GET    /api/customers/<customer_id>/files              — list files
POST   /api/customers/<customer_id>/files              — upload file (multipart/form-data)
DELETE /api/customers/<customer_id>/files/<file_id>    — delete file
GET    /api/files/<storage_key>                        — download/preview file
"""
import os
from flask import Blueprint, request, g, current_app, send_file
from app.services import file_service
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import permission_required

files_bp = Blueprint("files", __name__)


def _upload_folder():
    return current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))


@files_bp.get("/api/customers/<customer_id>/files")
@permission_required("customers.read")
def list_files(customer_id):
    files = file_service.list_files(customer_id)
    return success_response(serialize_doc(files))


@files_bp.post("/api/customers/<customer_id>/files")
@permission_required("customers.update")
def upload_file(customer_id):
    if "file" not in request.files:
        return error_response("No file provided.", 400)

    uploaded = request.files["file"]
    if not uploaded.filename:
        return error_response("No file selected.", 400)

    try:
        doc = file_service.save_file(customer_id, uploaded, g.current_user_id, _upload_folder())
    except AppError as e:
        return error_response(e.message, e.status_code)

    return success_response(serialize_doc(doc), message="File uploaded.", status_code=201)


@files_bp.delete("/api/customers/<customer_id>/files/<file_id>")
@permission_required("customers.update")
def delete_file(customer_id, file_id):
    try:
        file_service.delete_file(file_id, g.current_user_id, _upload_folder())
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(message="File deleted.")


@files_bp.get("/api/files/<path:storage_key>")
@permission_required("customers.read")
def download_file(storage_key):
    path = file_service.get_file_path(storage_key, _upload_folder())
    if not os.path.exists(path):
        return error_response("File not found.", 404)
    return send_file(path, as_attachment=False)
