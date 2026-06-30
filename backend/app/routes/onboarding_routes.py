"""Onboarding wizard (2.2) and industry-specific starter packs (7.4)."""
from flask import Blueprint, request
from app.utils.responses import success_response

onboarding_bp = Blueprint("onboarding", __name__, url_prefix="/api/onboarding")

INDUSTRY_STARTER_PACKS = {
    "real_estate": {
        "name": "Real Estate",
        "pipelines": [
            {"name": "Property Sales", "stages": ["Lead", "Viewing", "Offer", "Negotiation", "Closed"]},
            {"name": "Rentals", "stages": ["Inquiry", "Viewing", "Application", "Approved", "Leased"]},
        ],
        "fields": ["property_type", "budget_range", "preferred_location", "buyer_agent"],
        "email_templates": ["Property Showing Confirmation", "Offer Submitted", "Market Update"],
    },
    "agency": {
        "name": "Creative / Digital Agency",
        "pipelines": [
            {"name": "Client Acquisition", "stages": ["Inquiry", "Brief", "Proposal", "Negotiation", "Onboarded"]},
            {"name": "Project Pipeline", "stages": ["Discovery", "Design", "Development", "Review", "Delivered"]},
        ],
        "fields": ["agency_type", "monthly_budget", "services_needed", "decision_timeline"],
        "email_templates": ["Proposal Follow-up", "Project Kickoff", "Monthly Report"],
    },
    "healthcare": {
        "name": "Healthcare / Clinic",
        "pipelines": [
            {"name": "Patient Onboarding", "stages": ["Inquiry", "Scheduled", "Consultation", "Active", "Discharged"]},
        ],
        "fields": ["specialty", "license_number", "insurance_accepted", "clinic_name"],
        "email_templates": ["Appointment Confirmation", "Follow-up Visit", "Health Tips"],
    },
    "consulting": {
        "name": "Consulting",
        "pipelines": [
            {"name": "Engagement Pipeline", "stages": ["Discovery", "Proposal", "Negotiation", "Active", "Completed"]},
        ],
        "fields": ["consulting_type", "hourly_rate", "engagement_scope", "duration_months"],
        "email_templates": ["Engagement Proposal", "Status Update", "Invoice Notification"],
    },
    "retail": {
        "name": "Retail / E-commerce",
        "pipelines": [
            {"name": "Sales Pipeline", "stages": ["Lead", "Quote", "Negotiation", "Order", "Delivered"]},
        ],
        "fields": ["store_type", "average_order_value", "sales_channel", "inventory_needs"],
        "email_templates": ["Order Confirmation", "Shipping Update", "Feedback Request"],
    },
}

DEFAULT_PIPELINE = {
    "name": "Default Sales",
    "stages": ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
}


@onboarding_bp.get("/industries")
def list_industries():
    packs = {k: {"name": v["name"]} for k, v in INDUSTRY_STARTER_PACKS.items()}
    return success_response(packs)


@onboarding_bp.get("/starter-pack/<industry>")
def get_starter_pack(industry):
    pack = INDUSTRY_STARTER_PACKS.get(industry)
    if not pack:
        return success_response({"default": True, "pipeline": DEFAULT_PIPELINE})
    return success_response(pack)
