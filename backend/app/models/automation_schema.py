from marshmallow import Schema, fields, validate

AUTOMATION_STATUSES = ["active", "inactive", "draft"]
AUTOMATION_TRIGGER_TYPES = [
    "lead_created", "lead_status_changed", "customer_created",
    "deal_stage_changed", "deal_status_changed", "task_completed",
    "email_opened", "email_replied", "link_clicked",
    "form_submitted", "meeting_completed", "invoice_paid",
    "ticket_created", "ticket_status_changed", "date_based",
    "score_reached",
]
AUTOMATION_ACTION_TYPES = [
    "send_email", "send_whatsapp", "update_field", "assign_owner",
    "change_stage", "create_task", "create_followup", "add_tag",
    "remove_tag", "send_notification", "webhook", "score_lead",
    "trigger_workflow",
]


class AutomationTriggerSchema(Schema):
    type = fields.String(required=True, validate=validate.OneOf(AUTOMATION_TRIGGER_TYPES))
    conditions = fields.Dict(load_default=dict)
    delay_minutes = fields.Integer(load_default=0, validate=validate.Range(min=0))


class AutomationActionSchema(Schema):
    type = fields.String(required=True, validate=validate.OneOf(AUTOMATION_ACTION_TYPES))
    config = fields.Dict(required=True)


class AutomationCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    status = fields.String(load_default="draft", validate=validate.OneOf(AUTOMATION_STATUSES))
    trigger = fields.Nested(AutomationTriggerSchema, required=True)
    actions = fields.List(fields.Nested(AutomationActionSchema), required=True, validate=validate.Length(min=1))
    object_type = fields.String(required=True)


class AutomationUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    status = fields.String(validate=validate.OneOf(AUTOMATION_STATUSES))
    trigger = fields.Nested(AutomationTriggerSchema)
    actions = fields.List(fields.Nested(AutomationActionSchema), validate=validate.Length(min=1))
    object_type = fields.String()
