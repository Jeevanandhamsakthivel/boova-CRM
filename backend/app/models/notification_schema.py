"""
Validation schemas for Notification System (SRS Chapter 18).
"""
from marshmallow import Schema, fields, validate

NOTIFICATION_TYPES = ["task_due", "followup_due", "lead_assigned", "deal_won", "deal_lost", "system", "mention"]


class NotificationCreateSchema(Schema):
    user_id = fields.String(required=True)
    type = fields.String(required=True, validate=validate.OneOf(NOTIFICATION_TYPES))
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    message = fields.String(required=True, validate=validate.Length(max=1000))
    link = fields.String(required=False, allow_none=True)


class NotificationMarkReadSchema(Schema):
    is_read = fields.Boolean(required=True)