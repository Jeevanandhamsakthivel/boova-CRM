from marshmallow import Schema, fields, validate

TEMPLATE_CATEGORIES = [
    "construction", "manufacturing", "healthcare", "education",
    "retail", "software", "real_estate", "finance", "insurance",
    "hospitality", "law_firm", "digital_marketing", "logistics", "custom"
]


class WorkflowTemplateNodeSchema(Schema):
    id = fields.String(required=True)
    type = fields.String(required=True)
    label = fields.String(allow_none=True)
    position = fields.Dict(keys=fields.String(), values=fields.Float(), required=True)
    config = fields.Dict(keys=fields.String(), load_default=dict)
    children = fields.List(fields.String(), load_default=list)


class WorkflowTemplateEdgeSchema(Schema):
    id = fields.String(required=True)
    source = fields.String(required=True)
    target = fields.String(required=True)
    source_handle = fields.String(allow_none=True)
    target_handle = fields.String(allow_none=True)
    label = fields.String(allow_none=True)
    condition = fields.String(allow_none=True)


class WorkflowTemplateStageSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    order = fields.Integer(required=True)
    entity_type = fields.String(allow_none=True)
    color = fields.String(allow_none=True)
    config = fields.Dict(keys=fields.String(), load_default=dict)


class WorkflowTemplateCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True)
    category = fields.String(required=True, validate=validate.OneOf(TEMPLATE_CATEGORIES))
    entity_type = fields.String(required=True, validate=validate.OneOf([
        "lead", "customer", "company", "deal", "task",
        "ticket", "user", "quote", "invoice", "contact"
    ]))
    nodes = fields.List(fields.Nested(WorkflowTemplateNodeSchema), load_default=list)
    edges = fields.List(fields.Nested(WorkflowTemplateEdgeSchema), load_default=list)
    stages = fields.List(fields.Nested(WorkflowTemplateStageSchema), load_default=list)
    tags = fields.List(fields.String(), load_default=list)
    industry = fields.String(allow_none=True)
    is_built_in = fields.Boolean(load_default=False)
    config = fields.Dict(keys=fields.String(), load_default=dict)


class WorkflowTemplateUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True)
    category = fields.String(validate=validate.OneOf(TEMPLATE_CATEGORIES))
    entity_type = fields.String(validate=validate.OneOf([
        "lead", "customer", "company", "deal", "task",
        "ticket", "user", "quote", "invoice", "contact"
    ]))
    nodes = fields.List(fields.Nested(WorkflowTemplateNodeSchema))
    edges = fields.List(fields.Nested(WorkflowTemplateEdgeSchema))
    stages = fields.List(fields.Nested(WorkflowTemplateStageSchema))
    tags = fields.List(fields.String())
    industry = fields.String(allow_none=True)
    config = fields.Dict(keys=fields.String())
