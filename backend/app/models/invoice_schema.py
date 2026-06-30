from marshmallow import Schema, fields, validate

INVOICE_STATUSES = ["draft", "sent", "paid", "partial", "overdue", "cancelled"]
INVOICE_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD"]
PAYMENT_METHODS = ["stripe", "razorpay", "bank_transfer", "cash", "check", "other"]
PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"]


class InvoiceLineItemSchema(Schema):
    description = fields.String(required=True, validate=validate.Length(max=500))
    quantity = fields.Integer(load_default=1, validate=validate.Range(min=1))
    unit_price = fields.Float(required=True, validate=validate.Range(min=0))
    discount_percent = fields.Float(load_default=0, validate=validate.Range(min=0, max=100))


class InvoiceCreateSchema(Schema):
    invoice_number = fields.String(required=False, allow_none=True, validate=validate.Length(max=50))
    customer_id = fields.String(required=True)
    quote_id = fields.String(required=False, allow_none=True)
    deal_id = fields.String(required=False, allow_none=True)
    line_items = fields.List(fields.Nested(InvoiceLineItemSchema), load_default=list)
    subtotal = fields.Float(load_default=0, validate=validate.Range(min=0))
    tax_percent = fields.Float(load_default=0, validate=validate.Range(min=0, max=100))
    tax_amount = fields.Float(load_default=0, validate=validate.Range(min=0))
    total = fields.Float(load_default=0, validate=validate.Range(min=0))
    amount_paid = fields.Float(load_default=0, validate=validate.Range(min=0))
    balance_due = fields.Float(load_default=0, validate=validate.Range(min=0))
    currency = fields.String(load_default="USD", validate=validate.OneOf(INVOICE_CURRENCIES))
    status = fields.String(load_default="draft", validate=validate.OneOf(INVOICE_STATUSES))
    issue_date = fields.DateTime(required=False, allow_none=True)
    due_date = fields.DateTime(required=False, allow_none=True)
    payment_link = fields.String(required=False, allow_none=True, validate=validate.Length(max=500))
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    terms = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(required=False, allow_none=True)


class InvoiceUpdateSchema(Schema):
    line_items = fields.List(fields.Nested(InvoiceLineItemSchema))
    subtotal = fields.Float(validate=validate.Range(min=0))
    tax_percent = fields.Float(validate=validate.Range(min=0, max=100))
    tax_amount = fields.Float(validate=validate.Range(min=0))
    total = fields.Float(validate=validate.Range(min=0))
    amount_paid = fields.Float(validate=validate.Range(min=0))
    balance_due = fields.Float(validate=validate.Range(min=0))
    currency = fields.String(validate=validate.OneOf(INVOICE_CURRENCIES))
    status = fields.String(validate=validate.OneOf(INVOICE_STATUSES))
    due_date = fields.DateTime(allow_none=True)
    payment_link = fields.String(allow_none=True, validate=validate.Length(max=500))
    notes = fields.String(allow_none=True, validate=validate.Length(max=2000))
    terms = fields.String(allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(allow_none=True)


class PaymentCreateSchema(Schema):
    invoice_id = fields.String(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    method = fields.String(required=True, validate=validate.OneOf(PAYMENT_METHODS))
    transaction_id = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    status = fields.String(load_default="completed", validate=validate.OneOf(PAYMENT_STATUSES))
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=1000))
