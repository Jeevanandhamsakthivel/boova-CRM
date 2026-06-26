"""
Validation schemas for Lead Management (SRS Chapter 10) and
Lead Qualification Workflow (SRS Chapter 11).
"""
from marshmallow import Schema, fields, validate

LEAD_STATUSES = ["new", "contacted", "qualified", "unqualified", "converted", "lost"]
LEAD_SOURCES = ["website", "referral", "social_media", "email_campaign", "cold_call", "event", "other"]
QUALIFICATION_LEVELS = ["hot", "warm", "cold"]


class LeadCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    email = fields.Email(required=False, allow_none=True)
    phone = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    company = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))
    job_title = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    source = fields.String(load_default="other", validate=validate.OneOf(LEAD_SOURCES))
    status = fields.String(load_default="new", validate=validate.OneOf(LEAD_STATUSES))
    qualification = fields.String(
        load_default=None, allow_none=True, validate=validate.OneOf(QUALIFICATION_LEVELS)
    )
    estimated_value = fields.Float(load_default=0, validate=validate.Range(min=0))
    assigned_to = fields.String(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    tags = fields.List(fields.String(), load_default=list)


class LeadUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=150))
    email = fields.Email(allow_none=True)
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    company = fields.String(allow_none=True, validate=validate.Length(max=150))
    job_title = fields.String(allow_none=True, validate=validate.Length(max=100))
    source = fields.String(validate=validate.OneOf(LEAD_SOURCES))
    status = fields.String(validate=validate.OneOf(LEAD_STATUSES))
    qualification = fields.String(allow_none=True, validate=validate.OneOf(QUALIFICATION_LEVELS))
    estimated_value = fields.Float(validate=validate.Range(min=0))
    assigned_to = fields.String(allow_none=True)
    notes = fields.String(allow_none=True, validate=validate.Length(max=2000))
    tags = fields.List(fields.String())


class LeadConvertSchema(Schema):
    """Convert a qualified lead into a Customer record."""
    create_deal = fields.Boolean(load_default=False)
    deal_title = fields.String(required=False, allow_none=True)
    deal_value = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0))