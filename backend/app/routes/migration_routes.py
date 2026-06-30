"""Migration and import assistance endpoints."""
from flask import Blueprint, request
from marshmallow import ValidationError

from app.services import migration_service
from app.utils.responses import success_response, error_response
from app.utils.errors import format_marshmallow_errors
from app.middlewares.auth_middleware import jwt_required_custom

migration_bp = Blueprint("migration", __name__, url_prefix="/api/migration")


class ImportPreviewSchema:
    def load(self, payload):
        if not isinstance(payload, list):
            raise ValidationError({"records": ["Expected a list of records."]})
        return payload


@migration_bp.post("/preview")
@jwt_required_custom()
def preview_import():
    try:
        payload = ImportPreviewSchema().load(request.get_json(force=True, silent=True) or [])
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    cleaned = migration_service.clean_import_payload(payload)
    return success_response({"records": cleaned, "count": len(cleaned)})
