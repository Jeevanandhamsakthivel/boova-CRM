from marshmallow import Schema, fields, validate

TICKET_STATUSES = ["new", "open", "in_progress", "waiting_on_customer", "resolved", "closed"]
TICKET_PRIORITIES = ["low", "medium", "high", "urgent"]
TICKET_CHANNELS = ["email", "whatsapp", "phone", "chat", "web", "portal"]


class TicketCreateSchema(Schema):
    subject = fields.String(required=True, validate=validate.Length(min=2, max=300))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=5000))
    customer_id = fields.String(required=False, allow_none=True)
    contact_email = fields.Email(required=False, allow_none=True)
    status = fields.String(load_default="new", validate=validate.OneOf(TICKET_STATUSES))
    priority = fields.String(load_default="medium", validate=validate.OneOf(TICKET_PRIORITIES))
    channel = fields.String(load_default="email", validate=validate.OneOf(TICKET_CHANNELS))
    category = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    assigned_to = fields.String(required=False, allow_none=True)
    deal_id = fields.String(required=False, allow_none=True)
    tags = fields.List(fields.String(), load_default=list)


class TicketUpdateSchema(Schema):
    subject = fields.String(validate=validate.Length(min=2, max=300))
    description = fields.String(allow_none=True, validate=validate.Length(max=5000))
    status = fields.String(validate=validate.OneOf(TICKET_STATUSES))
    priority = fields.String(validate=validate.OneOf(TICKET_PRIORITIES))
    category = fields.String(allow_none=True, validate=validate.Length(max=100))
    assigned_to = fields.String(allow_none=True)
    tags = fields.List(fields.String())


class TicketReplySchema(Schema):
    body = fields.String(required=True, validate=validate.Length(min=1, max=5000))
    is_internal = fields.Boolean(load_default=False)
