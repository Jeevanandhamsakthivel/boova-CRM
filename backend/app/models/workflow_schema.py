from marshmallow import Schema, fields, validate, pre_load

WORKFLOW_STATUSES = ["draft", "active", "inactive", "archived"]
WORKFLOW_CATEGORIES = [
    "customer", "employee", "approval", "department",
    "automation", "notification", "assignment"
]


class WorkflowNodeSchema(Schema):
    id = fields.String(required=True)
    type = fields.String(required=True, validate=validate.OneOf([
        "start", "end", "condition", "approval", "reject",
        "wait", "assign_owner", "transfer_owner", "notification",
        "email", "whatsapp", "sms", "create_task", "update_record",
        "generate_document", "webhook", "rest_api", "ai_decision",
        "merge", "parallel"
    ]))
    label = fields.String(allow_none=True)
    position = fields.Dict(keys=fields.String(), values=fields.Float(), required=True)
    config = fields.Dict(keys=fields.String(), load_default=dict)
    children = fields.List(fields.String(), load_default=list)


class WorkflowEdgeSchema(Schema):
    id = fields.String(required=True)
    source = fields.String(required=True)
    target = fields.String(required=True)
    source_handle = fields.String(allow_none=True)
    target_handle = fields.String(allow_none=True)
    label = fields.String(allow_none=True)
    condition = fields.String(allow_none=True)


class WorkflowStageSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    order = fields.Integer(required=True)
    entity_type = fields.String(allow_none=True)
    color = fields.String(allow_none=True)
    config = fields.Dict(keys=fields.String(), load_default=dict)


class WorkflowCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True)
    category = fields.String(required=True, validate=validate.OneOf(WORKFLOW_CATEGORIES))
    status = fields.String(load_default="draft", validate=validate.OneOf(WORKFLOW_STATUSES))
    entity_type = fields.String(required=True, validate=validate.OneOf([
        "lead", "customer", "company", "deal", "task",
        "ticket", "user", "quote", "invoice", "contact"
    ]))
    nodes = fields.List(fields.Nested(WorkflowNodeSchema), load_default=list)
    edges = fields.List(fields.Nested(WorkflowEdgeSchema), load_default=list)
    stages = fields.List(fields.Nested(WorkflowStageSchema), load_default=list)
    assigned_to = fields.String(allow_none=True)
    department = fields.String(allow_none=True)
    tags = fields.List(fields.String(), load_default=list)
    config = fields.Dict(keys=fields.String(), load_default=dict)


class WorkflowUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True)
    category = fields.String(validate=validate.OneOf(WORKFLOW_CATEGORIES))
    status = fields.String(validate=validate.OneOf(WORKFLOW_STATUSES))
    entity_type = fields.String(validate=validate.OneOf([
        "lead", "customer", "company", "deal", "task",
        "ticket", "user", "quote", "invoice", "contact"
    ]))
    nodes = fields.List(fields.Nested(WorkflowNodeSchema))
    edges = fields.List(fields.Nested(WorkflowEdgeSchema))
    stages = fields.List(fields.Nested(WorkflowStageSchema))
    assigned_to = fields.String(allow_none=True)
    department = fields.String(allow_none=True)
    tags = fields.List(fields.String())
    config = fields.Dict(keys=fields.String())
