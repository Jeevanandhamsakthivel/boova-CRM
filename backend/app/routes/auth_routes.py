"""
Authentication routes (SRS Chapter 7: Authentication Module).
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/me
POST /api/auth/change-password
"""
from flask import Blueprint, request, g
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    get_jwt_identity,
)
from marshmallow import ValidationError

from app.models.auth_schema import (
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema,
    UpdateProfileSchema,
)
from app.services import user_service
from app.services.token_service import add_token_to_blocklist
from app.services.audit_service import record_audit_log
from app.utils.responses import success_response, error_response
from app.utils.errors import AppError, format_marshmallow_errors
from app.middlewares.auth_middleware import jwt_required_custom

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _issue_tokens(user):
    identity = str(user["_id"])
    additional_claims = {"role": user["role"], "email": user["email"]}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)
    return access_token, refresh_token


@auth_bp.post("/register")
def register():
    try:
        data = RegisterSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        user = user_service.create_user(data)
    except AppError as e:
        return error_response(e.message, e.status_code, e.errors)

    access_token, refresh_token = _issue_tokens(user)
    record_audit_log(str(user["_id"]), "register", "user", str(user["_id"]))

    return success_response(
        {
            "user": user_service.public_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Registration successful.",
        status_code=201,
    )


@auth_bp.post("/login")
def login():
    try:
        data = LoginSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        user = user_service.authenticate_user(data["email"], data["password"])
    except AppError as e:
        return error_response(e.message, e.status_code, e.errors)

    access_token, refresh_token = _issue_tokens(user)
    record_audit_log(str(user["_id"]), "login", "user", str(user["_id"]))

    return success_response(
        {
            "user": user_service.public_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Login successful.",
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    try:
        user = user_service.get_user_by_id(identity)
    except AppError as e:
        return error_response(e.message, e.status_code)

    access_token, _ = _issue_tokens(user)
    return success_response({"access_token": access_token}, message="Token refreshed.")


@auth_bp.post("/logout")
@jwt_required_custom()
def logout():
    claims = get_jwt()
    add_token_to_blocklist(claims["jti"])
    record_audit_log(g.current_user_id, "logout", "user", g.current_user_id)
    return success_response(message="Logged out successfully.")


@auth_bp.get("/me")
@jwt_required_custom()
def get_me():
    try:
        user = user_service.get_user_by_id(g.current_user_id)
    except AppError as e:
        return error_response(e.message, e.status_code)
    return success_response(user_service.public_user(user))


@auth_bp.put("/me")
@jwt_required_custom()
def update_me():
    try:
        data = UpdateProfileSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    user = user_service.update_user_profile(g.current_user_id, data)
    return success_response(user_service.public_user(user), message="Profile updated.")


@auth_bp.post("/change-password")
@jwt_required_custom()
def change_password():
    try:
        data = ChangePasswordSchema().load(request.get_json(force=True, silent=True) or {})
    except ValidationError as err:
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    try:
        user_service.change_password(
            g.current_user_id, data["current_password"], data["new_password"]
        )
    except AppError as e:
        return error_response(e.message, e.status_code)

    return success_response(message="Password changed successfully.")