import json
import logging
from flask import current_app
import requests

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _build_headers():
    api_key = current_app.config.get("GROQ_API_KEY", "")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _call_groq(messages, model=None, temperature=0.3, max_tokens=1024):
    api_key = current_app.config.get("GROQ_API_KEY", "")
    if not api_key:
        return {"success": False, "message": "GROQ_API_KEY not configured on server"}

    model = model or current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        resp = requests.post(GROQ_URL, headers=_build_headers(), json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return {
            "success": True,
            "message": content,
            "model": data.get("model", model),
            "usage": {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
        }
    except requests.RequestException as e:
        logger.error("Groq API call failed: %s", e)
        return {"success": False, "message": f"AI service error: {str(e)}"}
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.error("Groq response parse error: %s", e)
        return {"success": False, "message": "Failed to parse AI response"}


def ask(context, prompt):
    messages = [
        {"role": "system", "content": f"You are a Business OS AI assistant. Context: {context}"},
        {"role": "user", "content": prompt},
    ]
    result = _call_groq(messages, temperature=0.3)
    if result["success"]:
        result["suggestions"] = _extract_suggestions(result["message"])
    return result


def analyze(data_type, data):
    system_prompts = {
        "dashboard": (
            "You are a CRM analytics AI. Analyze the following CRM summary and provide "
            "3-4 actionable insights. For each insight include: type (opportunity/alert/trend/tip), "
            "a short title, description, and suggested action. Return as a JSON array."
        ),
        "next_best_action": (
            "You are a productivity AI. Given the following CRM task data, recommend the single "
            "most impactful action the user should take right now. Be specific and concise "
            "(max 200 characters)."
        ),
    }
    system = system_prompts.get(data_type, "You are a Business OS analytics AI. Analyze the data and provide insights.")
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(data)},
    ]
    result = _call_groq(messages, temperature=0.4, max_tokens=2048)
    if result["success"]:
        if data_type == "dashboard":
            try:
                insights = json.loads(result["message"])
                if isinstance(insights, list):
                    result["insights"] = insights
                    result["summary"] = f"Generated {len(insights)} insights"
                    result["recommendations"] = [i.get("description", "") for i in insights if "description" in i]
            except (json.JSONDecodeError, TypeError):
                result["insights"] = []
                result["summary"] = result["message"]
                result["recommendations"] = []
        elif data_type == "next_best_action":
            result["recommendations"] = [result["message"]]
            result["summary"] = result["message"]
    return result


def generate(template, params):
    messages = [
        {"role": "system", "content": f"You are a Business OS content generator. Template: {template}"},
        {"role": "user", "content": json.dumps(params)},
    ]
    result = _call_groq(messages, temperature=0.5, max_tokens=2048)
    if result["success"]:
        result["content"] = result["message"]
        result["meta"] = {"template": template, "model": result.get("model")}
    return result


def _extract_suggestions(text):
    lines = [l.strip().lstrip("*-•") for l in text.split("\n") if l.strip()]
    suggestions = [l for l in lines if len(l) > 10 and len(l) < 150][:5]
    if not suggestions:
        return ["Review your CRM data for more insights"]
    return suggestions
