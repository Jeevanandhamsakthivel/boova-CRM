"""
Validation schemas for Authentication & User Management
(SRS Chapter 7: Authentication Module, Chapter 8: RBAC).
"""
from marshmallow import Schema, fields, validate, validates, ValidationError

from app.utils.rbac import ALL_ROLES


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    role = fields.String(load_default="agent", validate=validate.OneOf(ALL_ROLES))
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class ChangePasswordSchema(Schema):
    current_password = fields.String(required=True)
    new_password = fields.String(required=True, validate=validate.Length(min=8, max=128))


class UpdateProfileSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=100))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    avatar_url = fields.String(allow_none=True)

    # Professional
    job_title = fields.String(allow_none=True, validate=validate.Length(max=100))
    department = fields.String(allow_none=True, validate=validate.Length(max=100))
    bio = fields.String(allow_none=True, validate=validate.Length(max=500))

    # Contact
    address_line1 = fields.String(allow_none=True, validate=validate.Length(max=200))
    address_line2 = fields.String(allow_none=True, validate=validate.Length(max=200))
    city = fields.String(allow_none=True, validate=validate.Length(max=100))
    state = fields.String(allow_none=True, validate=validate.Length(max=100))
    zip_code = fields.String(allow_none=True, validate=validate.Length(max=20))
    country = fields.String(allow_none=True, validate=validate.Length(max=100))

    # Social
    linkedin = fields.String(allow_none=True, validate=validate.Length(max=200))
    github = fields.String(allow_none=True, validate=validate.Length(max=200))
    twitter = fields.String(allow_none=True, validate=validate.Length(max=200))
    website = fields.String(allow_none=True, validate=validate.Length(max=200))

    # Preferences
    timezone = fields.String(allow_none=True, validate=validate.Length(max=50))
    language = fields.String(allow_none=True, validate=validate.Length(max=10))
    date_format = fields.String(allow_none=True, validate=validate.Length(max=20))
    notification_preferences = fields.Dict(allow_none=True)


class AdminUpdateUserSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=100))
    role = fields.String(validate=validate.OneOf(ALL_ROLES))
    status = fields.String(validate=validate.OneOf(["active", "inactive", "suspended"]))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))


class RefreshSchema(Schema):
    refresh_token = fields.String(required=False)