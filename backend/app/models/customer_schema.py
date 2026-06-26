"""
Validation schemas for Customer Management (SRS Chapter 12).
"""
from marshmallow import Schema, fields, validate

CUSTOMER_STATUSES = ["active", "inactive", "churned"]


class AddressSchema(Schema):
    street = fields.String(allow_none=True, validate=validate.Length(max=200))
    city = fields.String(allow_none=True, validate=validate.Length(max=100))
    state = fields.String(allow_none=True, validate=validate.Length(max=100))
    postal_code = fields.String(allow_none=True, validate=validate.Length(max=20))
    country = fields.String(allow_none=True, validate=validate.Length(max=100))


class CustomerCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    email = fields.Email(required=True)
    phone = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    company = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))
    status = fields.String(load_default="active", validate=validate.OneOf(CUSTOMER_STATUSES))
    address = fields.Nested(AddressSchema, required=False, load_default=dict)
    assigned_to = fields.String(required=False, allow_none=True)
    lifetime_value = fields.Float(load_default=0, validate=validate.Range(min=0))
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    tags = fields.List(fields.String(), load_default=list)
    source_lead_id = fields.String(required=False, allow_none=True)


class CustomerUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=150))
    email = fields.Email()
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    company = fields.String(allow_none=True, validate=validate.Length(max=150))
    status = fields.String(validate=validate.OneOf(CUSTOMER_STATUSES))
    address = fields.Nested(AddressSchema)
    assigned_to = fields.String(allow_none=True)
    lifetime_value = fields.Float(validate=validate.Range(min=0))
    notes = fields.String(allow_none=True, validate=validate.Length(max=2000))
    tags = fields.List(fields.String())