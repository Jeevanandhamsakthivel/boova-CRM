"""
Validation schemas for Sales Pipeline Module (SRS Chapter 16).
"""
from marshmallow import Schema, fields, validate

DEAL_STATUSES  = ["open", "won", "lost"]
DEAL_TYPES     = ["new_business", "existing_business", "renewal", "upsell"]
DEAL_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD"]


class PipelineStageCreateSchema(Schema):
    name            = fields.String(required=True, validate=validate.Length(min=2, max=100))
    order           = fields.Integer(required=True, validate=validate.Range(min=0))
    win_probability = fields.Integer(load_default=0, validate=validate.Range(min=0, max=100))
    color           = fields.String(load_default="#3B82F6")


class PipelineStageUpdateSchema(Schema):
    name            = fields.String(validate=validate.Length(min=2, max=100))
    order           = fields.Integer(validate=validate.Range(min=0))
    win_probability = fields.Integer(validate=validate.Range(min=0, max=100))
    color           = fields.String()


class DealCreateSchema(Schema):
    title               = fields.String(required=True, validate=validate.Length(min=2, max=200))
    customer_id         = fields.String(required=True)
    stage_id            = fields.String(required=True)
    value               = fields.Float(load_default=0, validate=validate.Range(min=0))
    currency            = fields.String(load_default="USD", validate=validate.OneOf(DEAL_CURRENCIES))
    status              = fields.String(load_default="open", validate=validate.OneOf(DEAL_STATUSES))
    type                = fields.String(load_default="new_business", validate=validate.OneOf(DEAL_TYPES))
    assigned_to         = fields.String(required=True)
    expected_close_date = fields.DateTime(required=False, allow_none=True)
    probability         = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=0, max=100))
    description         = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    notes               = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    source              = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    competitor          = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))
    next_step           = fields.String(required=False, allow_none=True, validate=validate.Length(max=500))
    tags                = fields.List(fields.String(), load_default=list)


class DealUpdateSchema(Schema):
    title               = fields.String(validate=validate.Length(min=2, max=200))
    stage_id            = fields.String()
    value               = fields.Float(validate=validate.Range(min=0))
    currency            = fields.String(validate=validate.OneOf(DEAL_CURRENCIES))
    status              = fields.String(validate=validate.OneOf(DEAL_STATUSES))
    type                = fields.String(validate=validate.OneOf(DEAL_TYPES))
    assigned_to         = fields.String()
    expected_close_date = fields.DateTime(allow_none=True)
    probability         = fields.Integer(allow_none=True, validate=validate.Range(min=0, max=100))
    description         = fields.String(allow_none=True, validate=validate.Length(max=2000))
    notes               = fields.String(allow_none=True, validate=validate.Length(max=2000))
    source              = fields.String(allow_none=True, validate=validate.Length(max=100))
    competitor          = fields.String(allow_none=True, validate=validate.Length(max=150))
    next_step           = fields.String(allow_none=True, validate=validate.Length(max=500))
    tags                = fields.List(fields.String())


class DealMoveStageSchema(Schema):
    stage_id = fields.String(required=True)