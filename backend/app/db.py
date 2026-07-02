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

    # --- Companies ---
    db.companies.create_index([("name", ASCENDING)], unique=True, name="uniq_company_name")
    db.companies.create_index([("domain", ASCENDING)], name="idx_company_domain")
    db.companies.create_index([("industry", ASCENDING)], name="idx_company_industry")
    db.companies.create_index([("status", ASCENDING)], name="idx_company_status")
    db.companies.create_index([("assigned_to", ASCENDING)], name="idx_company_assigned_to")
    db.companies.create_index([("created_at", DESCENDING)], name="idx_company_created_at")
    db.companies.create_index(
        [("name", TEXT), ("domain", TEXT), ("email", TEXT)], name="text_company_search"
    )

    # --- Quotes ---
    db.quotes.create_index([("customer_id", ASCENDING)], name="idx_quote_customer")
    db.quotes.create_index([("status", ASCENDING)], name="idx_quote_status")
    db.quotes.create_index([("assigned_to", ASCENDING)], name="idx_quote_assigned_to")
    db.quotes.create_index([("created_at", DESCENDING)], name="idx_quote_created_at")

    # --- Invoices ---
    db.invoices.create_index([("customer_id", ASCENDING)], name="idx_invoice_customer")
    db.invoices.create_index([("status", ASCENDING)], name="idx_invoice_status")
    db.invoices.create_index([("invoice_number", ASCENDING)], unique=True, name="uniq_invoice_number")
    db.invoices.create_index([("assigned_to", ASCENDING)], name="idx_invoice_assigned_to")
    db.invoices.create_index([("due_date", ASCENDING)], name="idx_invoice_due_date")
    db.invoices.create_index([("created_at", DESCENDING)], name="idx_invoice_created_at")

    # --- Payments ---
    db.payments.create_index([("invoice_id", ASCENDING)], name="idx_payment_invoice")
    db.payments.create_index([("transaction_id", ASCENDING)], name="idx_payment_transaction")
    db.payments.create_index([("created_at", DESCENDING)], name="idx_payment_created_at")

    # --- Tickets (Support Desk) ---
    db.tickets.create_index([("customer_id", ASCENDING)], name="idx_ticket_customer")
    db.tickets.create_index([("status", ASCENDING)], name="idx_ticket_status")
    db.tickets.create_index([("priority", ASCENDING)], name="idx_ticket_priority")
    db.tickets.create_index([("assigned_to", ASCENDING)], name="idx_ticket_assigned_to")
    db.tickets.create_index([("category", ASCENDING)], name="idx_ticket_category")
    db.tickets.create_index([("created_at", DESCENDING)], name="idx_ticket_created_at")

    # --- Knowledge Base ---
    db.kb_articles.create_index([("title", ASCENDING)], name="idx_kb_title")
    db.kb_articles.create_index([("status", ASCENDING)], name="idx_kb_status")
    db.kb_articles.create_index([("category", ASCENDING)], name="idx_kb_category")
    db.kb_articles.create_index([("visibility", ASCENDING)], name="idx_kb_visibility")
    db.kb_articles.create_index(
        [("title", TEXT), ("content", TEXT)], name="text_kb_search"
    )

    # --- Meetings ---
    db.meetings.create_index([("customer_id", ASCENDING)], name="idx_meeting_customer")
    db.meetings.create_index([("lead_id", ASCENDING)], name="idx_meeting_lead")
    db.meetings.create_index([("assigned_to", ASCENDING)], name="idx_meeting_assigned_to")
    db.meetings.create_index([("status", ASCENDING)], name="idx_meeting_status")
    db.meetings.create_index([("start_time", ASCENDING)], name="idx_meeting_start_time")

    # --- Emails ---
    db.emails.create_index([("customer_id", ASCENDING)], name="idx_email_customer")
    db.emails.create_index([("lead_id", ASCENDING)], name="idx_email_lead")
    db.emails.create_index([("direction", ASCENDING)], name="idx_email_direction")
    db.emails.create_index([("created_at", DESCENDING)], name="idx_email_created_at")
    db.email_templates.create_index([("name", ASCENDING)], name="idx_email_template_name")

    # --- WhatsApp ---
    db.whatsapp_messages.create_index([("customer_id", ASCENDING)], name="idx_wa_customer")
    db.whatsapp_messages.create_index([("lead_id", ASCENDING)], name="idx_wa_lead")
    db.whatsapp_messages.create_index([("direction", ASCENDING)], name="idx_wa_direction")
    db.whatsapp_messages.create_index([("created_at", DESCENDING)], name="idx_wa_created_at")

    # --- Automations ---
    db.automations.create_index([("status", ASCENDING)], name="idx_automation_status")
    db.automations.create_index([("object_type", ASCENDING)], name="idx_automation_object_type")
    db.automations.create_index([("trigger.type", ASCENDING)], name="idx_automation_trigger_type")

    # --- Workflows ---
    db.workflows.create_index([("status", ASCENDING)], name="idx_workflow_status")
    db.workflows.create_index([("category", ASCENDING)], name="idx_workflow_category")
    db.workflows.create_index([("entity_type", ASCENDING)], name="idx_workflow_entity_type")
    db.workflows.create_index([("created_by", ASCENDING)], name="idx_workflow_created_by")
    db.workflows.create_index([("updated_at", DESCENDING)], name="idx_workflow_updated_at")
    db.workflows.create_index([("name", TEXT), ("description", TEXT)], name="text_workflow_search")

    # --- Workflow Templates ---
    db.workflow_templates.create_index([("category", ASCENDING)], name="idx_wf_template_category")
    db.workflow_templates.create_index([("entity_type", ASCENDING)], name="idx_wf_template_entity_type")
    db.workflow_templates.create_index([("industry", ASCENDING)], name="idx_wf_template_industry")
    db.workflow_templates.create_index([("is_built_in", ASCENDING)], name="idx_wf_template_builtin")

    # --- Workflow Executions ---
    db.workflow_executions.create_index([("workflow_id", ASCENDING)], name="idx_wf_exec_workflow")
    db.workflow_executions.create_index([("status", ASCENDING)], name="idx_wf_exec_status")
    db.workflow_executions.create_index([("entity_type", ASCENDING), ("entity_id", ASCENDING)], name="idx_wf_exec_entity")
    db.workflow_executions.create_index([("trigger_type", ASCENDING)], name="idx_wf_exec_trigger")
    db.workflow_executions.create_index([("created_at", DESCENDING)], name="idx_wf_exec_created_at")

    # --- AI Setup Wizard (Organizations, Branches, Departments) ---
    db.organizations.create_index([("user_id", ASCENDING)], name="idx_org_user")
    db.organizations.create_index([("business_type", ASCENDING)], name="idx_org_business_type")
    db.organizations.create_index([("setup_completed", ASCENDING)], name="idx_org_setup_completed")
    db.branches.create_index([("organization_id", ASCENDING)], name="idx_branch_org")
    db.departments.create_index([("organization_id", ASCENDING)], name="idx_dept_org")
    db.departments.create_index([("name", ASCENDING)], name="idx_dept_name")
    db.roles.create_index([("organization_id", ASCENDING)], name="idx_role_org")
    db.roles.create_index([("level", ASCENDING)], name="idx_role_level")
    db.dashboards.create_index([("organization_id", ASCENDING)], name="idx_dashboard_org")
    db.forms.create_index([("organization_id", ASCENDING)], name="idx_form_org")
    db.permissions.create_index([("organization_id", ASCENDING)], name="idx_perm_org")
    db.permissions.create_index([("role", ASCENDING)], name="idx_perm_role")

    logger.info("All MongoDB indexes ensured.")