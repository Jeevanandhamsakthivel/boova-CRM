"""
Global error handlers, per SRS Chapter 28 (Error Handling): every error
type returns a consistent JSON envelope instead of leaking stack traces.
"""
import logging
from flask import Flask
from werkzeug.exceptions import HTTPException
from marshmallow import ValidationError

from app.utils.errors import AppError, format_marshmallow_errors
from app.utils.responses import error_response

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask):

    @app.errorhandler(AppError)
    def handle_app_error(err):
        return error_response(err.message, err.status_code, err.errors)

    @app.errorhandler(ValidationError)
    def handle_validation_error(err):
        return error_response("Validation failed.", 422, format_marshmallow_errors(err))

    @app.errorhandler(ValueError)
    def handle_value_error(err):
        return error_response(str(err), 400)

    @app.errorhandler(404)
    def handle_404(err):
        return error_response("The requested resource was not found.", 404)

    @app.errorhandler(405)
    def handle_405(err):
        return error_response("Method not allowed.", 405)

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return error_response(err.description or "An error occurred.", err.code or 500)

    @app.errorhandler(Exception)
    def handle_unexpected_error(err):
        logger.exception("Unhandled exception: %s", err)
        return error_response("An unexpected error occurred. Please try again later.", 500)