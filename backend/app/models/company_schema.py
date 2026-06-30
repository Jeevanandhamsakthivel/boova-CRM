from marshmallow import Schema, fields, validate

COMPANY_INDUSTRIES = [
    "technology", "finance", "healthcare", "retail", "manufacturing",
    "real_estate", "education", "consulting", "media", "logistics",
    "hospitality", "legal", "construction", "nonprofit", "other"
]
COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]
COMPANY_STATUSES = ["active", "inactive", "prospect", "churned"]


class CompanyCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    domain = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    industry = fields.String(required=False, allow_none=True, validate=validate.OneOf(COMPANY_INDUSTRIES))
    company_size = fields.String(required=False, allow_none=True, validate=validate.OneOf(COMPANY_SIZES))
    status = fields.String(load_default="active", validate=validate.OneOf(COMPANY_STATUSES))
    email = fields.Email(required=False, allow_none=True)
    phone = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    website = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    linkedin_url = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    annual_revenue = fields.Float(load_default=0, validate=validate.Range(min=0))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(required=False, allow_none=True)
    tags = fields.List(fields.String(), load_default=list)


class CompanyUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    domain = fields.String(allow_none=True, validate=validate.Length(max=200))
    industry = fields.String(allow_none=True, validate=validate.OneOf(COMPANY_INDUSTRIES))
    company_size = fields.String(allow_none=True, validate=validate.OneOf(COMPANY_SIZES))
    status = fields.String(validate=validate.OneOf(COMPANY_STATUSES))
    email = fields.Email(allow_none=True)
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    website = fields.String(allow_none=True, validate=validate.Length(max=200))
    linkedin_url = fields.String(allow_none=True, validate=validate.Length(max=200))
    annual_revenue = fields.Float(validate=validate.Range(min=0))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    assigned_to = fields.String(allow_none=True)
    tags = fields.List(fields.String())
