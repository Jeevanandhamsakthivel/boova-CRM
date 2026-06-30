"""
Validation schemas for Customer Management (SRS Chapter 12).
"""
from marshmallow import Schema, fields, validate

CUSTOMER_STATUSES   = ["active", "inactive", "churned", "prospect"]
CUSTOMER_INDUSTRIES = [
    "technology", "finance", "healthcare", "retail", "manufacturing",
    "real_estate", "education", "consulting", "media", "logistics", "other"
]
CUSTOMER_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]


class AddressSchema(Schema):
    street      = fields.String(allow_none=True, validate=validate.Length(max=200))
    city        = fields.String(allow_none=True, validate=validate.Length(max=100))
    state       = fields.String(allow_none=True, validate=validate.Length(max=100))
    postal_code = fields.String(allow_none=True, validate=validate.Length(max=20))
    country     = fields.String(allow_none=True, validate=validate.Length(max=100))


class CustomerCreateSchema(Schema):
    name            = fields.String(required=True, validate=validate.Length(min=2, max=150))
    email           = fields.Email(required=True)
    phone           = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    mobile          = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    company         = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))
    job_title       = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    department      = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    website         = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    linkedin_url    = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    industry        = fields.String(required=False, allow_none=True, validate=validate.OneOf(CUSTOMER_INDUSTRIES))
    company_size    = fields.String(required=False, allow_none=True, validate=validate.OneOf(CUSTOMER_SIZES))
    status          = fields.String(load_default="active", validate=validate.OneOf(CUSTOMER_STATUSES))
    address         = fields.Nested(AddressSchema, required=False, load_default=dict)
    assigned_to     = fields.String(required=False, allow_none=True)
    lifetime_value  = fields.Float(load_default=0, validate=validate.Range(min=0))
    annual_revenue  = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0))
    notes           = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    tags            = fields.List(fields.String(), load_default=list)
    source_lead_id  = fields.String(required=False, allow_none=True)
    currency        = fields.String(load_default="USD", validate=validate.Length(max=10))
    timezone        = fields.String(required=False, allow_none=True, validate=validate.Length(max=60))
    whatsapp        = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))


class CustomerUpdateSchema(Schema):
    name            = fields.String(validate=validate.Length(min=2, max=150))
    email           = fields.Email()
    phone           = fields.String(allow_none=True, validate=validate.Length(max=20))
    mobile          = fields.String(allow_none=True, validate=validate.Length(max=20))
    company         = fields.String(allow_none=True, validate=validate.Length(max=150))
    job_title       = fields.String(allow_none=True, validate=validate.Length(max=100))
    department      = fields.String(allow_none=True, validate=validate.Length(max=100))
    website         = fields.String(allow_none=True, validate=validate.Length(max=200))
    linkedin_url    = fields.String(allow_none=True, validate=validate.Length(max=200))
    industry        = fields.String(allow_none=True, validate=validate.OneOf(CUSTOMER_INDUSTRIES))
    company_size    = fields.String(allow_none=True, validate=validate.OneOf(CUSTOMER_SIZES))
    status          = fields.String(validate=validate.OneOf(CUSTOMER_STATUSES))
    address         = fields.Nested(AddressSchema)
    assigned_to     = fields.String(allow_none=True)
    lifetime_value  = fields.Float(validate=validate.Range(min=0))
    annual_revenue  = fields.Float(allow_none=True, validate=validate.Range(min=0))
    notes           = fields.String(allow_none=True, validate=validate.Length(max=2000))
    tags            = fields.List(fields.String())
    currency        = fields.String(validate=validate.Length(max=10))
    timezone        = fields.String(allow_none=True, validate=validate.Length(max=60))
    whatsapp        = fields.String(allow_none=True, validate=validate.Length(max=20))