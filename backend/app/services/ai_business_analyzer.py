import re
from app.services.business_template_service import BUSINESS_TEMPLATES

BUSINESS_TYPE_KEYWORDS = {
    "manufacturing": ["manufacturing", "factory", "production", "plant", "industrial", "assembly", "fabrication", "heavy machinery", "manufacturer", "producer", "make products", "producing"],
    "construction": ["construction", "building", "contractor", "builder", "real estate development", "site", "civil", "infrastructure", "construction company", "home builder", "remodeling"],
    "healthcare": ["healthcare", "health care", "medical", "clinic", "doctor", "physician", "health services", "patient care", "clinical"],
    "hospital": ["hospital", "multi-specialty", "nursing home", "medical center", "super specialty", "inpatient", "surgery center"],
    "clinic": ["clinic", "general practice", "family practice", "outpatient", "polyclinic", "health center"],
    "pharmacy": ["pharmacy", "drug store", "chemist", "pharmaceutical retail", "medicine shop", "dispensary"],
    "school": ["school", "k-12", "primary school", "secondary school", "high school", "middle school"],
    "college": ["college", "undergraduate", "junior college", "degree college", "arts and science"],
    "university": ["university", "higher education", "research university", "deemed university", "central university"],
    "retail_store": ["retail", "store", "shop", "boutique", "supermarket", "grocery", "department store", "retail store", "e-commerce", "ecommerce", "online store"],
    "wholesale": ["wholesale", "distributor", "bulk", "wholesaler", "distribution", "wholesale trade", "stockist"],
    "logistics": ["logistics", "supply chain", "transport", "shipping", "freight", "warehouse", "3pl", "courier", "delivery service"],
    "transportation": ["transportation", "bus", "fleet", "passenger transport", "travel", "tour", "cab", "taxi", "car rental"],
    "real_estate": ["real estate", "property", "brokerage", "realty", "realtor", "property management", "apartment", "commercial property"],
    "software_company": ["software", "saas", "tech", "app", "platform", "digital product", "software product", "technology company", "startup"],
    "it_services": ["it services", "it consulting", "managed services", "outsourcing", "it support", "technology services", "software development services", "digital transformation"],
    "digital_marketing": ["digital marketing", "marketing agency", "seo", "social media", "advertising", "media agency", "content marketing", "performance marketing"],
    "finance": ["finance", "financial services", "bank", "investment", "wealth management", "financial advisory", "stock broking", "asset management", "nb fc"],
    "insurance": ["insurance", "insurance broking", "underwriting", "claims", "insurance agency", "life insurance", "general insurance"],
    "law_firm": ["law firm", "legal", "attorney", "lawyer", "advocate", "legal services", "legal practice", "solicitor", "law chamber"],
    "hotel": ["hotel", "resort", "hospitality", "lodging", "inn", "accommodation", "motel", "guest house"],
    "restaurant": ["restaurant", "cafe", "diner", "food", "bistro", "eatery", "catering", "bakery", "fast food", "fine dining"],
    "ngo": ["ngo", "non profit", "nonprofit", "charity", "foundation", "voluntary", "social work", "trust", "society"],
    "government": ["government", "public sector", "municipal", "government department", "public office", "state department", "civic body"],
    "startup": ["startup", "early stage", "venture", "entrepreneur", "new venture", "tech startup"],
    "consultancy": ["consultancy", "consulting", "management consulting", "advisory", "strategy consulting", "business consulting", "professional services"],
}

DEPARTMENT_KEYWORDS = {
    "sales": ["sales", "business development", "bd", "account management", "revenue"],
    "marketing": ["marketing", "digital marketing", "content", "social media", "brand", "advertising"],
    "engineering": ["engineering", "development", "technology", "tech", "software", "programming", "coding", "it", "dev"],
    "finance": ["finance", "accounting", "accounts", "payroll", "budget", "financial", "audit", "tax"],
    "hr": ["hr", "human resources", "talent", "recruitment", "people", "personnel", "training"],
    "operations": ["operations", "ops", "logistics", "supply chain", "production", "manufacturing"],
    "support": ["support", "customer service", "customer support", "help desk", "service desk", "after sales"],
    "procurement": ["procurement", "purchase", "buying", "sourcing", "vendor", "supplier"],
    "legal": ["legal", "compliance", "law", "regulatory", "documentation"],
    "rnd": ["r&d", "research", "development", "innovation", "product development"],
    "quality": ["quality", "qc", "qa", "quality control", "quality assurance", "inspection"],
    "warehouse": ["warehouse", "inventory", "stock", "storage", "goods"],
    "transport": ["transport", "transportation", "fleet", "logistics", "delivery", "shipping"],
}

ROLE_LEVEL_KEYWORDS = {
    1: ["ceo", "founder", "owner", "director", "managing director", "chairman", "president", "vice chancellor", "principal", "general manager", "partner"],
    2: ["cto", "cfo", "coo", "vice president", "vp", "head of", "director of", "chief", "medical director", "superintendent", "registrar"],
    3: ["manager", "lead", "head", "supervisor", "coordinator", "administrator", "dean", "hod", "practice lead"],
    4: ["senior", "lead", "specialist", "officer", "engineer", "analyst", "consultant", "executive", "associate"],
    5: ["junior", "assistant", "trainee", "intern", "clerk", "technician", "support"],
}

CUSTOMER_LIFECYCLE_KEYWORDS = {
    "lead": ["lead", "inquiry", "prospect", "suspect", "enquiry"],
    "visit": ["visit", "viewing", "show", "demonstration", "demo", "meeting"],
    "quote": ["quote", "quotation", "proposal", "estimate", "bid", "offer"],
    "negotiation": ["negotiation", "negotiate", "discussion", "bargain", "counter"],
    "approval": ["approval", "approve", "sanction", "clearance", "authorization"],
    "contract": ["contract", "agreement", "sign", "commitment", "order", "booking"],
    "delivery": ["delivery", "dispatch", "ship", "execute", "implement", "production", "manufacturing"],
    "support": ["support", "service", "warranty", "maintenance", "after sales", "help", "care"],
}

WORKFLOW_KEYWORDS = {
    "customer_management": ["customer", "client management", "account management"],
    "leave_approval": ["leave", "time off", "vacation", "absence", "holiday"],
    "purchase_request": ["purchase", "buy", "procurement", "procure", "procuring"],
    "expense_approval": ["expense", "reimbursement", "spend", "claim", "petty cash"],
    "invoice_approval": ["invoice", "billing", "bill", "payment", "receivable"],
    "support_ticket": ["support", "ticket", "complaint", "issue", "problem report"],
    "bug_reporting": ["bug", "error", "defect", "issue", "glitch"],
    "site_inspection": ["inspection", "site check", "quality check", "audit site"],
    "material_request": ["material", "raw material", "requisition", "stock request"],
    "patient_registration": ["patient registration", "admission", "enroll patient"],
    "appointment_booking": ["appointment", "schedule", "booking", "reservation"],
    "discharge_process": ["discharge", "release", "discharge summary"],
    "student_admission": ["admission", "enrollment", "registration student"],
    "booking_reservation": ["reservation", "booking", "room booking"],
}


def detect_business_type(description: str) -> str:
    description_lower = description.lower()
    scores = {}

    for biz_type, keywords in BUSINESS_TYPE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in description_lower)
        if score > 0:
            scores[biz_type] = score

    if not scores:
        return "custom_business"

    return max(scores, key=scores.get)


def extract_departments(description: str) -> list:
    description_lower = description.lower()
    found = set()

    for dept, keywords in DEPARTMENT_KEYWORDS.items():
        if any(kw in description_lower for kw in keywords):
            found.add(dept)

    return list(found)


def extract_roles(description: str) -> list:
    description_lower = description.lower()
    roles = []

    words = re.findall(r'\b\w+\b', description_lower)
    role_hints = [w for w in words if w in [
        "sales", "finance", "procurement", "procures", "procuring",
        "purchases", "engineers", "support", "manager", "executives",
        "delivery", "marketing", "hr", "admin", "operations",
        "quality", "production", "inventory", "logistics"
    ]]

    seen = set()
    for hint in role_hints:
        if hint not in seen:
            seen.add(hint)
            level = 4 if hint in ["executives", "associates", "staff"] else 3
            role_name = hint.capitalize() + " Manager" if level <= 3 else hint.capitalize()
            roles.append({"name": role_name, "level": level, "department": hint.capitalize()})

    return roles


def extract_customer_lifecycle(description: str) -> list:
    description_lower = description.lower()
    stages = []

    for canonical, keywords in CUSTOMER_LIFECYCLE_KEYWORDS.items():
        if any(kw in description_lower for kw in keywords):
            stage_name = canonical.capitalize()
            if stage_name not in stages:
                stages.append(stage_name)

    if "delivery" in description_lower and "Delivery" not in stages:
        stages.append("Delivery")

    return stages if stages else ["Lead", "Contact", "Qualify", "Convert"]


def extract_workflows(description: str) -> list:
    description_lower = description.lower()
    workflows = []

    for canonical, keywords in WORKFLOW_KEYWORDS.items():
        if any(kw in description_lower for kw in keywords):
            workflows.append(canonical)

    workflows.append("leave_approval")
    workflows.append("expense_approval")

    return list(set(workflows))


def extract_employee_count(description: str) -> int:
    patterns = [
        r'(\d+)\s*employees?',
        r'(\d+)\s*people?',
        r'(\d+)\s*staff',
        r'(\d+)\s*workers?',
        r'(\d+)\s*team members?',
        r'(\d+)\s*headcount',
    ]
    for pattern in patterns:
        match = re.search(pattern, description.lower())
        if match:
            return int(match.group(1))
    return 0


def analyze_business(description: str, basic_info: dict = None) -> dict:
    biz_type = detect_business_type(description)
    template = BUSINESS_TEMPLATES.get(biz_type, BUSINESS_TEMPLATES["custom_business"])

    departments = template["departments"]
    roles = template["roles"]
    lifecycle = template["customer_lifecycle"]
    workflows = template["workflows"]

    extracted_depts = extract_departments(description)
    if extracted_depts:
        custom_depts = []
        for dept_name in extracted_depts:
            custom_depts.append({
                "name": dept_name.capitalize(),
                "teams": [dept_name.capitalize() + " Team"]
            })
        departments = custom_depts if custom_depts else departments

    extracted_roles = extract_roles(description)
    if extracted_roles:
        roles = extracted_roles

    extracted_lifecycle = extract_customer_lifecycle(description)
    if extracted_lifecycle:
        lifecycle = extracted_lifecycle

    extracted_workflows = extract_workflows(description)
    if extracted_workflows:
        workflows = extracted_workflows

    employee_count = extract_employee_count(description)
    if not employee_count and basic_info and basic_info.get("employee_count"):
        employee_count = basic_info["employee_count"]

    result = {
        "business_type": biz_type,
        "business_type_name": template["name"],
        "business_type_icon": template.get("icon", "🔧"),
        "analysis_summary": f"Detected: {template['name']} with {len(departments)} departments, {len(roles)} role levels, {len(lifecycle)} customer stages.",
        "departments": departments,
        "roles": roles,
        "customer_lifecycle": lifecycle,
        "workflows": workflows,
        "dashboards": template["dashboards"],
        "forms": template["forms"],
        "automations": template["automations"],
        "permissions": template["permissions"],
        "employee_count": employee_count,
        "confidence": "high" if biz_type != "custom_business" else "medium",
    }

    return result
