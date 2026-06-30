"""Smart Field Auto-Population (5.2) and enrichment service."""
from app.db import get_db


def auto_populate_from_email(email_domain):
    """Given an email domain, try to look up existing company data."""
    db = get_db()
    if not email_domain:
        return {}

    company = db.companies.find_one({"domain": {"$regex": email_domain, "$options": "i"}})
    if company:
        return {
            "company": company.get("name"),
            "industry": company.get("industry"),
            "company_size": company.get("company_size"),
        }

    hint = {}
    known_domains = {
        "gmail.com": {"company": "", "industry": ""},
        "yahoo.com": {"company": "", "industry": ""},
        "outlook.com": {"company": "", "industry": ""},
    }
    hint = known_domains.get(email_domain.lower(), {})
    return hint


def auto_populate_from_phone(phone):
    """Placeholder - in production, query phone number enrichment API."""
    return {}


def suggest_industry(company_name):
    """Simple keyword-based industry suggestion."""
    if not company_name:
        return None
    name_lower = company_name.lower()
    keywords = {
        "technology": ["tech", "software", "digital", "cloud", "data", "ai", "saas", "it "],
        "finance": ["bank", "finance", "insurance", "invest", "capital", "wealth"],
        "healthcare": ["health", "medical", "clinic", "hospital", "pharma", "care"],
        "retail": ["retail", "store", "shop", "ecommerce", "commerce"],
        "real_estate": ["real estate", "property", "housing", "realtor"],
        "education": ["education", "school", "academy", "learning", "training"],
        "consulting": ["consult", "advisory", "strategy"],
        "media": ["media", "news", "publishing", "broadcast"],
        "logistics": ["logistics", "transport", "shipping", "delivery", "freight"],
        "legal": ["legal", "law", "attorney", "solicitor"],
        "construction": ["construction", "building", "engineering", "infra"],
    }
    for industry, words in keywords.items():
        for word in words:
            if word in name_lower:
                return industry
    return None


def enrich_record(record):
    """Auto-populate fields on a lead/customer record where possible."""
    enriched = {}
    email = record.get("email", "")
    if email and "@" in email:
        domain = email.split("@")[1]
        enrichment = auto_populate_from_email(domain)
        if enrichment.get("company"):
            enriched["company"] = enrichment["company"]
            if not record.get("industry"):
                enriched["industry"] = enrichment.get("industry") or suggest_industry(enrichment["company"])
        elif not record.get("company") and not record.get("industry"):
            suggested = suggest_industry(domain.split(".")[0])
            if suggested:
                enriched["industry"] = suggested

    company_name = record.get("company", "")
    if company_name and not record.get("industry"):
        suggested = suggest_industry(company_name)
        if suggested:
            enriched["industry"] = suggested

    return enriched
