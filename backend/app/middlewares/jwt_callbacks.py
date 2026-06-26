"""
JWT callback registrations: token blocklist checking and custom error
payloads for expired/invalid/missing tokens (SRS Chapter 36).
"""
from app.extensions import jwt
from app.utils.responses import error_response


def register_jwt_callbacks(app):

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from app.services.token_service import is_token_revoked
        return is_token_revoked(jwt_payload["jti"])

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token has expired. Please log in again.", 401)

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return error_response(f"Invalid token: {reason}", 401)

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return error_response(f"Authorization token required: {reason}", 401)

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response("Token has been revoked. Please log in again.", 401)