from marshmallow import Schema, fields, validate

QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"]
QUOTE_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD"]


class QuoteLineItemSchema(Schema):
    description = fields.String(required=True, validate=validate.Length(max=500))
    quantity = fields.Integer(load_default=1, validate=validate.Range(min=1))
    unit_price = fields.Float(required=True, validate=validate.Range(min=0))
    discount_percent = fields.Float(load_default=0, validate=validate.Range(min=0, max=100))


class QuoteCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    customer_id = fields.String(required=True)
    deal_id = fields.String(required=False, allow_none=True)
    line_items = fields.List(fields.Nested(QuoteLineItemSchema), load_default=list)
    subtotal = fields.Float(load_default=0, validate=validate.Range(min=0))
    tax_percent = fields.Float(load_default=0, validate=validate.Range(min=0, max=100))
    tax_amount = fields.Float(load_default=0, validate=validate.Range(min=0))
    total = fields.Float(load_default=0, validate=validate.Range(min=0))
    currency = fields.String(load_default="USD", validate=validate.OneOf(QUOTE_CURRENCIES))
    status = fields.String(load_default="draft", validate=validate.OneOf(QUOTE_STATUSES))
    valid_until = fields.DateTime(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    terms = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(required=False, allow_none=True)


class QuoteUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=200))
    line_items = fields.List(fields.Nested(QuoteLineItemSchema))
    subtotal = fields.Float(validate=validate.Range(min=0))
    tax_percent = fields.Float(validate=validate.Range(min=0, max=100))
    tax_amount = fields.Float(validate=validate.Range(min=0))
    total = fields.Float(validate=validate.Range(min=0))
    currency = fields.String(validate=validate.OneOf(QUOTE_CURRENCIES))
    status = fields.String(validate=validate.OneOf(QUOTE_STATUSES))
    valid_until = fields.DateTime(allow_none=True)
    notes = fields.String(allow_none=True, validate=validate.Length(max=2000))
    terms = fields.String(allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(allow_none=True)
