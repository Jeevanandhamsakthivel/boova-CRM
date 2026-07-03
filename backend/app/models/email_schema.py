from marshmallow import Schema, fields, validate


class AttachmentSchema(Schema):
    filename = fields.String(required=True, validate=validate.Length(min=1))
    content_type = fields.String(load_default="application/octet-stream")
    content = fields.Raw(required=True)  # base64-encoded bytes or raw bytes


class EmailSendSchema(Schema):
    to = fields.List(fields.Email(), required=True, validate=validate.Length(min=1))
    cc = fields.List(fields.Email(), load_default=list)
    bcc = fields.List(fields.Email(), load_default=list)
    subject = fields.String(required=True, validate=validate.Length(min=1, max=998))
    body = fields.String(required=True)
    html = fields.Boolean(load_default=True)
    customer_id = fields.String(allow_none=True, load_default=None)
    lead_id = fields.String(allow_none=True, load_default=None)
    deal_id = fields.String(allow_none=True, load_default=None)
    template_id = fields.String(allow_none=True, load_default=None)
    template_vars = fields.Dict(keys=fields.String(), load_default=dict)
    attachments = fields.List(fields.Nested(AttachmentSchema), load_default=list)


class InboundEmailSchema(Schema):
    from_addr = fields.Email(data_key="from", required=True)
    from_name = fields.String(allow_none=True, load_default=None)
    to = fields.List(fields.Email(), required=True)
    cc = fields.List(fields.Email(), load_default=list)
    subject = fields.String(allow_none=True, load_default="")
    body = fields.String(allow_none=True, load_default="")
    html_body = fields.String(allow_none=True, load_default=None, data_key="html")
    message_id = fields.String(allow_none=True, load_default=None)
    in_reply_to = fields.String(allow_none=True, load_default=None)
    references = fields.String(allow_none=True, load_default=None)
    attachments = fields.List(fields.Dict, load_default=list)
    customer_id = fields.String(allow_none=True, load_default=None)
    lead_id = fields.String(allow_none=True, load_default=None)
    deal_id = fields.String(allow_none=True, load_default=None)


class EmailTemplateCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    subject = fields.String(required=True, validate=validate.Length(min=1, max=998))
    body = fields.String(required=True)
    category = fields.String(allow_none=True, validate=validate.Length(max=100), load_default=None)


class EmailTemplateUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    subject = fields.String(validate=validate.Length(min=1, max=998))
    body = fields.String()
    category = fields.String(allow_none=True, validate=validate.Length(max=100))
