"""
Flask application factory (SRS Chapter 24: Backend Architecture).
"""
import os
import logging
from flask import Flask, send_from_directory

from app.config import get_config
from app.extensions import jwt, cors
from app.db import init_db
from app.utils.error_handlers import register_error_handlers
from app.middlewares.jwt_callbacks import register_jwt_callbacks

from app.routes.auth_routes import auth_bp
from app.routes.user_routes import users_bp
from app.routes.lead_routes import leads_bp
from app.routes.customer_routes import customers_bp
from app.routes.followup_routes import followups_bp
from app.routes.task_routes import tasks_bp
from app.routes.deal_routes import pipeline_bp, deals_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.report_routes import reports_bp
from app.routes.search_routes import search_bp
from app.routes.notification_routes import notifications_bp
from app.routes.settings_routes import settings_bp
from app.routes.audit_routes import audit_bp
from app.routes.activity_routes import activities_bp
from app.routes.migration_routes import migration_bp
from app.routes.health_routes import health_bp
from app.routes.quote_routes import quotes_bp
from app.routes.invoice_routes import invoices_bp, payments_bp
from app.routes.company_routes import companies_bp
from app.routes.ticket_routes import tickets_bp
from app.routes.knowledge_base_routes import kb_bp
from app.routes.email_routes import email_bp
from app.routes.whatsapp_routes import whatsapp_bp
from app.routes.calendar_routes import calendar_bp
from app.routes.automation_routes import automation_bp
from app.routes.bulk_action_routes import bulk_bp
from app.routes.data_export_routes import export_bp
from app.routes.enrichment_routes import enrich_bp
from app.routes.migration_enhanced_routes import migration_enhanced_bp
from app.routes.pricing_routes import pricing_bp
from app.routes.onboarding_routes import onboarding_bp
from app.routes.workflow_routes import workflows_bp
from app.routes.workflow_template_routes import workflow_templates_bp
from app.routes.workflow_execution_routes import workflow_executions_bp
from app.routes.workflow_analytics_routes import workflow_analytics_bp
from app.routes.setup_wizard_routes import setup_wizard_bp
from app.routes.employee_setup_routes import employee_setup_bp
from app.routes.ai_routes import ai_bp
def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or get_config())

    logging.basicConfig(level=logging.INFO)

    # --- Extensions ---
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)
    register_jwt_callbacks(app)

    # --- Database ---
    init_db(app)

    # --- Error handlers ---
    register_error_handlers(app)

    # --- Blueprints ---
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(followups_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(pipeline_bp)
    app.register_blueprint(deals_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(migration_bp)
    app.register_blueprint(migration_enhanced_bp)
    app.register_blueprint(quotes_bp)
    app.register_blueprint(invoices_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(kb_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(whatsapp_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(automation_bp)
    app.register_blueprint(bulk_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(enrich_bp)
    app.register_blueprint(pricing_bp)
    app.register_blueprint(onboarding_bp)
    app.register_blueprint(workflows_bp)
    app.register_blueprint(workflow_templates_bp)
    app.register_blueprint(workflow_executions_bp)
    app.register_blueprint(workflow_analytics_bp)
    app.register_blueprint(setup_wizard_bp)
    app.register_blueprint(employee_setup_bp)
    app.register_blueprint(ai_bp)

    # Serve uploaded files (avatars, etc.)
    upload_dir = app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
    @app.get("/uploads/<path:filepath>")
    def serve_upload(filepath):
        safe_path = os.path.normpath(filepath)
        full = os.path.normpath(os.path.join(upload_dir, safe_path))
        if not full.startswith(os.path.normpath(upload_dir)):
            abort(403)
        return send_from_directory(upload_dir, safe_path)

    return app