"""
Flask application factory (SRS Chapter 24: Backend Architecture).
"""
import logging
from flask import Flask

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
from app.routes.health_routes import health_bp


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

    return app