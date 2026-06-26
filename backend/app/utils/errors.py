"""
Validation error handling, per SRS Chapter 27 (Validation Rules) and
Chapter 28 (Error Handling): every module must validate input and return
clear field-level error messages.
"""
from marshmallow import ValidationError


class AppError(Exception):
    """Base application error with HTTP status code."""

    def __init__(self, message, status_code=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or []


class NotFoundError(AppError):
    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message="Resource conflict", errors=None):
        super().__init__(message, status_code=409, errors=errors)


class ForbiddenError(AppError):
    def __init__(self, message="Forbidden"):
        super().__init__(message, status_code=403)


class UnauthorizedError(AppError):
    def __init__(self, message="Unauthorized"):
        super().__init__(message, status_code=401)


def format_marshmallow_errors(err: ValidationError):
    """Flatten marshmallow's nested error dict into a list of field errors."""
    formatted = []
    for field, messages in err.messages.items():
        if isinstance(messages, list):
            for msg in messages:
                formatted.append({"field": field, "message": msg})
        elif isinstance(messages, dict):
            for sub_field, sub_messages in messages.items():
                for msg in sub_messages:
                    formatted.append({"field": f"{field}.{sub_field}", "message": msg})
        else:
            formatted.append({"field": field, "message": str(messages)})
    return formatted