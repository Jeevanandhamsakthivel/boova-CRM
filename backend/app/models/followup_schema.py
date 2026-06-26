"""
Validation schemas for Follow-Up Management (SRS Chapter 13).
"""
from marshmallow import Schema, fields, validate

FOLLOWUP_STATUSES = ["pending", "completed", "cancelled", "overdue"]
FOLLOWUP_TYPES = ["call", "email", "meeting", "other"]
RELATED_TYPES = ["lead", "customer", "deal"]


class FollowUpCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    type = fields.String(load_default="call", validate=validate.OneOf(FOLLOWUP_TYPES))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    due_date = fields.DateTime(required=True)
    status = fields.String(load_default="pending", validate=validate.OneOf(FOLLOWUP_STATUSES))
    assigned_to = fields.String(required=True)
    related_to_type = fields.String(required=True, validate=validate.OneOf(RELATED_TYPES))
    related_to_id = fields.String(required=True)
    reminder_minutes_before = fields.Integer(load_default=30, validate=validate.Range(min=0))


class FollowUpUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=200))
    type = fields.String(validate=validate.OneOf(FOLLOWUP_TYPES))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    due_date = fields.DateTime()
    status = fields.String(validate=validate.OneOf(FOLLOWUP_STATUSES))
    assigned_to = fields.String()
    reminder_minutes_before = fields.Integer(validate=validate.Range(min=0))