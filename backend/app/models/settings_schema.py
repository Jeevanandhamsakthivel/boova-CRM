"""
Validation schemas for Settings Module (SRS Chapter 20).
"""
from marshmallow import Schema, fields, validate

SETTINGS_SCOPES = ["global", "user"]


class SettingUpsertSchema(Schema):
    key = fields.String(required=True, validate=validate.Length(min=1, max=100))
    value = fields.Raw(required=True)
    scope = fields.String(load_default="global", validate=validate.OneOf(SETTINGS_SCOPES))
    scope_id = fields.String(required=False, allow_none=True)