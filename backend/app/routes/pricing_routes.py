"""Pricing calculator (3.1) and plan comparison tools (1.5)."""
from flask import Blueprint, request
from app.utils.responses import success_response

pricing_bp = Blueprint("pricing", __name__, url_prefix="/api/pricing")

PLANS = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "seats": 2,
        "features": ["leads", "customers", "deals", "tasks", "email_logging"],
    },
    "starter": {
        "name": "Starter",
        "price_monthly": 15,
        "seats": 5,
        "features": ["leads", "customers", "companies", "deals", "tasks",
                     "email", "whatsapp", "quotes", "invoices", "automation",
                     "reports", "calendar"],
    },
    "professional": {
        "name": "Professional",
        "price_monthly": 39,
        "seats": 15,
        "features": ["all_starter", "tickets", "knowledge_base", "workflow_automation",
                     "custom_reports", "bulk_actions", "api_access", "priority_support"],
    },
    "enterprise": {
        "name": "Enterprise",
        "price_monthly": 79,
        "seats": 50,
        "features": ["all_professional", "audit_logs", "advanced_permissions",
                     "dedicated_support", "sla_guarantee", "custom_integrations"],
    },
}


@pricing_bp.get("/plans")
def list_plans():
    return success_response(PLANS)


@pricing_bp.post("/estimate")
def estimate_cost():
    """Estimate monthly cost based on plan and add-ons."""
    body = request.get_json(force=True, silent=True) or {}
    plan_id = body.get("plan", "free")
    extra_seats = int(body.get("extra_seats", 0))
    extra_users = int(body.get("extra_users", 0))

    plan = PLANS.get(plan_id)
    if not plan:
        return success_response({"error": "Invalid plan"}, status_code=400)

    extra_user_cost = extra_users * 10
    monthly = plan["price_monthly"] + extra_user_cost
    yearly = monthly * 12 * 0.83

    return success_response({
        "plan": plan_id,
        "plan_name": plan["name"],
        "base_monthly": plan["price_monthly"],
        "extra_seats": extra_seats,
        "extra_users": extra_users,
        "extra_user_cost": extra_user_cost,
        "monthly_total": monthly,
        "yearly_total": round(yearly, 2),
        "billing_options": ["monthly", "annual"],
    })


@pricing_bp.get("/cost-comparison")
def cost_comparison():
    """Competitor cost comparison tool (1.5)."""
    team_size = int(request.args.get("team_size", 5))
    months = int(request.args.get("months", 12))

    psm = PLANS["professional"]["price_monthly"] * team_size * months
    competitor_data = {
        "zoho": {"name": "Zoho CRM", "estimated_cost": team_size * 14 * months + 300},
        "salesforce": {"name": "Salesforce", "estimated_cost": team_size * 25 * months + 5000},
        "hubspot": {"name": "HubSpot", "estimated_cost": team_size * 50 * months + 3000},
    }

    return success_response({
        "psm_crm": {"name": "PSM CRM", "estimated_cost": psm},
        "competitors": competitor_data,
        "savings": {
            cmp: competitor_data[cmp]["estimated_cost"] - psm
            for cmp in competitor_data
        },
    })
