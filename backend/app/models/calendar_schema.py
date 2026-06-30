from marshmallow import Schema, fields, validate

MEETING_STATUSES = ["scheduled", "confirmed", "cancelled", "completed"]
MEETING_TYPES = ["call", "video", "in_person", "demo", "discovery", "followup"]
MEETING_PLATFORMS = ["google_meet", "zoom", "teams", "phone", "other"]


class MeetingCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    meeting_type = fields.String(load_default="call", validate=validate.OneOf(MEETING_TYPES))
    platform = fields.String(load_default="other", validate=validate.OneOf(MEETING_PLATFORMS))
    location = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    status = fields.String(load_default="scheduled", validate=validate.OneOf(MEETING_STATUSES))
    customer_id = fields.String(required=False, allow_none=True)
    lead_id = fields.String(required=False, allow_none=True)
    deal_id = fields.String(required=False, allow_none=True)
    assigned_to = fields.String(required=False, allow_none=True)
    attendees = fields.List(fields.String(), load_default=list)
    meeting_link = fields.String(required=False, allow_none=True, validate=validate.Length(max=500))


class MeetingUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    meeting_type = fields.String(validate=validate.OneOf(MEETING_TYPES))
    platform = fields.String(validate=validate.OneOf(MEETING_PLATFORMS))
    location = fields.String(allow_none=True, validate=validate.Length(max=200))
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    status = fields.String(validate=validate.OneOf(MEETING_STATUSES))
    assigned_to = fields.String(allow_none=True)
    attendees = fields.List(fields.String())
    meeting_link = fields.String(allow_none=True, validate=validate.Length(max=500))
