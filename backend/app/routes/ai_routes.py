from flask import Blueprint, request
from app.services import ai_service
from app.utils.responses import success_response, error_response

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.post("/ask")
def ask():
    body = request.get_json(force=True, silent=True) or {}
    context = body.get("context", "")
    prompt = body.get("prompt", "")
    if not prompt:
        return error_response("Prompt is required.", 422)
    result = ai_service.ask(context, prompt)
    if result["success"]:
        return success_response(result)
    return error_response(result["message"], 502)


@ai_bp.post("/analyze")
def analyze():
    body = request.get_json(force=True, silent=True) or {}
    data_type = body.get("data_type", "")
    data = body.get("data", {})
    if not data_type:
        return error_response("data_type is required.", 422)
    result = ai_service.analyze(data_type, data)
    if result["success"]:
        return success_response(result)
    return error_response(result["message"], 502)


@ai_bp.post("/generate")
def generate():
    body = request.get_json(force=True, silent=True) or {}
    template = body.get("template", "")
    params = body.get("params", {})
    if not template:
        return error_response("template is required.", 422)
    result = ai_service.generate(template, params)
    if result["success"]:
        return success_response(result)
    return error_response(result["message"], 502)
