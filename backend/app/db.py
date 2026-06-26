"""
MongoDB connection management and index bootstrapping.

Per SRS Chapter 21-23 (MongoDB Database Design, Collection Specifications,
Indexes & Optimization): every collection gets explicit indexes for the
fields used in filtering, search, and uniqueness constraints.
"""
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

_client = None
_db = None


def init_db(app):
    """Initialize MongoDB client/database and attach to the Flask app."""
    global _client, _db

    uri = app.config["MONGO_URI"]
    _client = MongoClient(uri, serverSelectionTimeoutMS=5000)

    try:
        _client.admin.command("ping")
    except ConnectionFailure as exc:
        logger.error("Could not connect to MongoDB at %s: %s", uri, exc)
        raise

    # Database name is taken from the URI path; default fallback below.
    _db = _client.get_default_database()
    if _db is None:
        _db = _client["psm_crm"]

    app.extensions["mongo_client"] = _client
    app.extensions["db"] = _db

    create_indexes(_db)
    logger.info("MongoDB connected: %s", _db.name)
    return _db


def get_db():
    """Return the active database handle. Must be called after init_db()."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_db(app) first.")
    return _db


def create_indexes(db):
    """
    Create all indexes required by the CRM modules:
    Users, Roles, Leads, Customers, FollowUps, Tasks, ActivityLogs,
    PipelineStages, Notifications, Reports, Settings, AuditLogs.
    """

    # --- Users ---
    db.users.create_index([("email", ASCENDING)], unique=True, name="uniq_email")
    db.users.create_index([("role", ASCENDING)], name="idx_role")
    db.users.create_index([("status", ASCENDING)], name="idx_status")
    db.users.create_index([("created_at", DESCENDING)], name="idx_created_at")

    # --- Roles (RBAC) ---
    db.roles.create_index([("name", ASCENDING)], unique=True, name="uniq_role_name")

    # --- Refresh tokens / sessions (for JWT logout/blocklist support) ---
    db.token_blocklist.create_index([("jti", ASCENDING)], unique=True, name="uniq_jti")
    db.token_blocklist.create_index(
        [("created_at", ASCENDING)], expireAfterSeconds=60 * 60 * 24 * 30, name="ttl_token_blocklist"
    )

    # --- Leads ---
    db.leads.create_index([("email", ASCENDING)], name="idx_lead_email")
    db.leads.create_index([("phone", ASCENDING)], name="idx_lead_phone")
    db.leads.create_index([("status", ASCENDING)], name="idx_lead_status")
    db.leads.create_index([("source", ASCENDING)], name="idx_lead_source")
    db.leads.create_index([("assigned_to", ASCENDING)], name="idx_lead_assigned_to")
    db.leads.create_index([("created_at", DESCENDING)], name="idx_lead_created_at")
    db.leads.create_index(
        [("name", TEXT), ("email", TEXT), ("company", TEXT)], name="text_lead_search"
    )

    # --- Customers ---
    db.customers.create_index([("email", ASCENDING)], unique=True, name="uniq_customer_email")
    db.customers.create_index([("phone", ASCENDING)], name="idx_customer_phone")
    db.customers.create_index([("status", ASCENDING)], name="idx_customer_status")
    db.customers.create_index([("assigned_to", ASCENDING)], name="idx_customer_assigned_to")
    db.customers.create_index([("created_at", DESCENDING)], name="idx_customer_created_at")
    db.customers.create_index(
        [("name", TEXT), ("email", TEXT), ("company", TEXT)], name="text_customer_search"
    )

    # --- Follow-ups ---
    db.followups.create_index([("related_to.id", ASCENDING)], name="idx_followup_related")
    db.followups.create_index([("assigned_to", ASCENDING)], name="idx_followup_assigned_to")
    db.followups.create_index([("status", ASCENDING)], name="idx_followup_status")
    db.followups.create_index([("due_date", ASCENDING)], name="idx_followup_due_date")

    # --- Tasks ---
    db.tasks.create_index([("assigned_to", ASCENDING)], name="idx_task_assigned_to")
    db.tasks.create_index([("status", ASCENDING)], name="idx_task_status")
    db.tasks.create_index([("priority", ASCENDING)], name="idx_task_priority")
    db.tasks.create_index([("due_date", ASCENDING)], name="idx_task_due_date")
    db.tasks.create_index([("related_to.id", ASCENDING)], name="idx_task_related")

    # --- Activity Timeline ---
    db.activities.create_index([("related_to.id", ASCENDING)], name="idx_activity_related")
    db.activities.create_index([("created_by", ASCENDING)], name="idx_activity_created_by")
    db.activities.create_index([("created_at", DESCENDING)], name="idx_activity_created_at")
    db.activities.create_index([("type", ASCENDING)], name="idx_activity_type")

    # --- Sales Pipeline ---
    db.pipeline_stages.create_index([("order", ASCENDING)], name="idx_stage_order")
    db.deals.create_index([("stage_id", ASCENDING)], name="idx_deal_stage")
    db.deals.create_index([("customer_id", ASCENDING)], name="idx_deal_customer")
    db.deals.create_index([("assigned_to", ASCENDING)], name="idx_deal_assigned_to")
    db.deals.create_index([("status", ASCENDING)], name="idx_deal_status")
    db.deals.create_index([("created_at", DESCENDING)], name="idx_deal_created_at")

    # --- Notifications ---
    db.notifications.create_index([("user_id", ASCENDING)], name="idx_notification_user")
    db.notifications.create_index([("is_read", ASCENDING)], name="idx_notification_read")
    db.notifications.create_index([("created_at", DESCENDING)], name="idx_notification_created_at")

    # --- Settings ---
    db.settings.create_index([("key", ASCENDING)], unique=True, name="uniq_settings_key")
    db.settings.create_index([("scope", ASCENDING), ("scope_id", ASCENDING)], name="idx_settings_scope")

    # --- Audit Logs ---
    db.audit_logs.create_index([("user_id", ASCENDING)], name="idx_audit_user")
    db.audit_logs.create_index([("entity_type", ASCENDING)], name="idx_audit_entity_type")
    db.audit_logs.create_index([("entity_id", ASCENDING)], name="idx_audit_entity_id")
    db.audit_logs.create_index([("created_at", DESCENDING)], name="idx_audit_created_at")

    logger.info("All MongoDB indexes ensured.")