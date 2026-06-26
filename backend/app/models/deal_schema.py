"""
Validation schemas for Sales Pipeline Module (SRS Chapter 16).
"""
from marshmallow import Schema, fields, validate

DEAL_STATUSES = ["open", "won", "lost"]


class PipelineStageCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    order = fields.Integer(required=True, validate=validate.Range(min=0))
    win_probability = fields.Integer(load_default=0, validate=validate.Range(min=0, max=100))
    color = fields.String(load_default="#3B82F6")


class PipelineStageUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=100))
    order = fields.Integer(validate=validate.Range(min=0))
    win_probability = fields.Integer(validate=validate.Range(min=0, max=100))
    color = fields.String()


class DealCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    customer_id = fields.String(required=True)
    stage_id = fields.String(required=True)
    value = fields.Float(load_default=0, validate=validate.Range(min=0))
    status = fields.String(load_default="open", validate=validate.OneOf(DEAL_STATUSES))
    assigned_to = fields.String(required=True)
    expected_close_date = fields.DateTime(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))


class DealUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=200))
    stage_id = fields.String()
    value = fields.Float(validate=validate.Range(min=0))
    status = fields.String(validate=validate.OneOf(DEAL_STATUSES))
    assigned_to = fields.String()
    expected_close_date = fields.DateTime(allow_none=True)
    notes = fields.String(allow_none=True, validate=validate.Length(max=2000))


class DealMoveStageSchema(Schema):
    stage_id = fields.String(required=True)