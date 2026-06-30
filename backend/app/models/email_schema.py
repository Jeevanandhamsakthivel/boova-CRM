from marshmallow import Schema, fields, validate


class EmailSendSchema(Schema):
    to = fields.List(fields.Email(), required=True, validate=validate.Length(min=1))
    cc = fields.List(fields.Email(), load_default=list)
    bcc = fields.List(fields.Email(), load_default=list)
    subject = fields.String(required=True, validate=validate.Length(min=1, max=500))
    body = fields.String(required=True)
    customer_id = fields.String(required=False, allow_none=True)
    lead_id = fields.String(required=False, allow_none=True)
    deal_id = fields.String(required=False, allow_none=True)
    template_id = fields.String(required=False, allow_none=True)


class EmailTemplateCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    subject = fields.String(required=True, validate=validate.Length(min=1, max=500))
    body = fields.String(required=True)
    category = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))


class EmailTemplateUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    subject = fields.String(validate=validate.Length(min=1, max=500))
    body = fields.String()
    category = fields.String(allow_none=True, validate=validate.Length(max=100))
