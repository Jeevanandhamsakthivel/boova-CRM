"""
Validation schemas for Task Management (SRS Chapter 14).
"""
from marshmallow import Schema, fields, validate

TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"]
TASK_PRIORITIES = ["low", "medium", "high", "urgent"]
RELATED_TYPES = ["lead", "customer", "deal", None]


class TaskCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    status = fields.String(load_default="todo", validate=validate.OneOf(TASK_STATUSES))
    priority = fields.String(load_default="medium", validate=validate.OneOf(TASK_PRIORITIES))
    due_date = fields.DateTime(required=False, allow_none=True)
    assigned_to = fields.String(required=True)
    related_to_type = fields.String(required=False, allow_none=True, validate=validate.OneOf(["lead", "customer", "deal"]))
    related_to_id = fields.String(required=False, allow_none=True)


class TaskUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    status = fields.String(validate=validate.OneOf(TASK_STATUSES))
    priority = fields.String(validate=validate.OneOf(TASK_PRIORITIES))
    due_date = fields.DateTime(allow_none=True)
    assigned_to = fields.String()