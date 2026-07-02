from marshmallow import Schema, fields, validate

EXECUTION_STATUSES = ["pending", "running", "completed", "failed", "cancelled", "paused"]


class WorkflowExecutionNodeLogSchema(Schema):
    node_id = fields.String(required=True)
    node_type = fields.String(required=True)
    status = fields.String(required=True, validate=validate.OneOf([
        "pending", "running", "completed", "failed", "skipped"
    ]))
    started_at = fields.DateTime(allow_none=True)
    completed_at = fields.DateTime(allow_none=True)
    input_data = fields.Dict(keys=fields.String(), load_default=dict)
    output_data = fields.Dict(keys=fields.String(), load_default=dict)
    error = fields.String(allow_none=True)
    duration_ms = fields.Integer(allow_none=True)


class WorkflowExecutionCreateSchema(Schema):
    workflow_id = fields.String(required=True)
    entity_type = fields.String(required=True)
    entity_id = fields.String(required=True)
    triggered_by = fields.String(allow_none=True)
    trigger_type = fields.String(load_default="manual", validate=validate.OneOf([
        "manual", "automated", "scheduled", "webhook", "event"
    ]))
    input_data = fields.Dict(keys=fields.String(), load_default=dict)


class WorkflowExecutionUpdateSchema(Schema):
    status = fields.String(validate=validate.OneOf(EXECUTION_STATUSES))
    node_logs = fields.List(fields.Nested(WorkflowExecutionNodeLogSchema))
    output_data = fields.Dict(keys=fields.String())
    error = fields.String(allow_none=True)
    completed_at = fields.DateTime(allow_none=True)
