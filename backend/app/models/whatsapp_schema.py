from marshmallow import Schema, fields, validate


class WhatsAppSendSchema(Schema):
    to = fields.String(required=True, validate=validate.Length(min=10, max=20))
    message = fields.String(required=True, validate=validate.Length(min=1, max=4096))
    customer_id = fields.String(required=False, allow_none=True)
    lead_id = fields.String(required=False, allow_none=True)
    template_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))


class WhatsAppTemplateCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    body = fields.String(required=True, validate=validate.Length(max=4096))
    category = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
