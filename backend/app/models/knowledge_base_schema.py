from marshmallow import Schema, fields, validate

KB_STATUSES = ["draft", "published", "archived"]
KB_VISIBILITIES = ["public", "internal", "team"]


class ArticleCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=300))
    content = fields.String(required=False, allow_none=True)
    category = fields.String(required=False, allow_none=True, validate=validate.Length(max=100))
    status = fields.String(load_default="draft", validate=validate.OneOf(KB_STATUSES))
    visibility = fields.String(load_default="internal", validate=validate.OneOf(KB_VISIBILITIES))
    tags = fields.List(fields.String(), load_default=list)


class ArticleUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=300))
    content = fields.String(allow_none=True)
    category = fields.String(allow_none=True, validate=validate.Length(max=100))
    status = fields.String(validate=validate.OneOf(KB_STATUSES))
    visibility = fields.String(validate=validate.OneOf(KB_VISIBILITIES))
    tags = fields.List(fields.String())
