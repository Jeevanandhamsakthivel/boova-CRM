from app.db import get_db
from app.utils.helpers import utcnow, to_object_id
from app.utils.errors import NotFoundError
from app.services.audit_service import record_audit_log

BUILT_IN_TEMPLATES = {
    "construction": {
        "name": "Construction Company Workflow",
        "description": "Complete workflow for construction companies covering Sales, Finance, Procurement, Site Engineers, and Support.",
        "category": "construction",
        "industry": "construction",
        "entity_type": "customer",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Lead", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Qualified", "order": 1, "entity_type": "lead", "color": "#8B5CF6"},
            {"id": "s3", "name": "Proposal", "order": 2, "entity_type": "deal", "color": "#3B82F6"},
            {"id": "s4", "name": "Negotiation", "order": 3, "entity_type": "deal", "color": "#F59E0B"},
            {"id": "s5", "name": "Approval", "order": 4, "entity_type": "deal", "color": "#F97316"},
            {"id": "s6", "name": "Won", "order": 5, "entity_type": "customer", "color": "#10B981"},
            {"id": "s7", "name": "Customer", "order": 6, "entity_type": "customer", "color": "#14B8A6"},
            {"id": "s8", "name": "Project", "order": 7, "entity_type": "project", "color": "#06B6D4"},
            {"id": "s9", "name": "Support", "order": 8, "entity_type": "ticket", "color": "#8B5CF6"},
            {"id": "s10", "name": "Renewal", "order": 9, "entity_type": "deal", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Start", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "approval", "label": "Sales Review", "position": {"x": 250, "y": 200}, "config": {"approval_type": "single", "assign_to_role": "manager"}},
            {"id": "n3", "type": "condition", "label": "Approved?", "position": {"x": 450, "y": 200}, "config": {}},
            {"id": "n4", "type": "assign_owner", "label": "Assign Sales Rep", "position": {"x": 650, "y": 100}, "config": {"assignment_type": "round_robin", "team": "Sales"}},
            {"id": "n5", "type": "notification", "label": "Notify Team", "position": {"x": 650, "y": 300}, "config": {"channels": ["email", "whatsapp"]}},
            {"id": "n6", "type": "end", "label": "End", "position": {"x": 850, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Yes", "condition": "approved"},
            {"id": "e4", "source": "n3", "target": "n5", "label": "No", "condition": "rejected"},
            {"id": "e5", "source": "n4", "target": "n6"},
            {"id": "e6", "source": "n5", "target": "n6"},
        ],
        "tags": ["sales", "approval", "construction"],
        "config": {"default_assignment_team": "Sales"},
    },
    "software": {
        "name": "SaaS Lead-to-Customer Workflow",
        "description": "End-to-end lead conversion pipeline for software/SaaS companies.",
        "category": "software",
        "industry": "software",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Lead", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Trial", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Qualified", "order": 2, "entity_type": "lead", "color": "#8B5CF6"},
            {"id": "s4", "name": "Demo", "order": 3, "entity_type": "lead", "color": "#F59E0B"},
            {"id": "s5", "name": "Proposal", "order": 4, "entity_type": "deal", "color": "#F97316"},
            {"id": "s6", "name": "Negotiation", "order": 5, "entity_type": "deal", "color": "#EF4444"},
            {"id": "s7", "name": "Closed Won", "order": 6, "entity_type": "customer", "color": "#10B981"},
            {"id": "s8", "name": "Onboarding", "order": 7, "entity_type": "customer", "color": "#14B8A6"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Start", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "create_task", "label": "Create Demo Task", "position": {"x": 250, "y": 200}, "config": {"task_type": "demo", "priority": "high"}},
            {"id": "n3", "type": "email", "label": "Send Welcome Email", "position": {"x": 450, "y": 200}, "config": {"template": "welcome_trial"}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["saas", "lead-conversion", "onboarding"],
        "config": {"auto_convert_lead": True},
    },
    "healthcare": {
        "name": "Healthcare Patient Workflow",
        "description": "Patient journey workflow for healthcare organizations.",
        "category": "healthcare",
        "industry": "healthcare",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Inquiry", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Scheduled", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Consultation", "order": 2, "entity_type": "customer", "color": "#8B5CF6"},
            {"id": "s4", "name": "Treatment", "order": 3, "entity_type": "customer", "color": "#F59E0B"},
            {"id": "s5", "name": "Follow-up", "order": 4, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "New Inquiry", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "assign_owner", "label": "Assign Doctor", "position": {"x": 250, "y": 200}, "config": {"assignment_type": "least_busy", "department": "Medical"}},
            {"id": "n3", "type": "notification", "label": "Send Appointment Reminder", "position": {"x": 450, "y": 200}, "config": {"channels": ["sms"], "template": "appointment_reminder"}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["healthcare", "patient", "appointment"],
        "config": {},
    },
    "finance": {
        "name": "Financial Services Workflow",
        "description": "Compliance-driven workflow for financial institutions.",
        "category": "finance",
        "industry": "finance",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Lead", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "KYC Verification", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Risk Assessment", "order": 2, "entity_type": "lead", "color": "#F59E0B"},
            {"id": "s4", "name": "Approval", "order": 3, "entity_type": "deal", "color": "#F97316"},
            {"id": "s5", "name": "Documentation", "order": 4, "entity_type": "deal", "color": "#8B5CF6"},
            {"id": "s6", "name": "Active", "order": 5, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "New Lead", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "approval", "label": "KYC Approval", "position": {"x": 250, "y": 200}, "config": {"approval_type": "sequential", "required_approvers": 2}},
            {"id": "n3", "type": "condition", "label": "KYC Passed?", "position": {"x": 450, "y": 200}, "config": {}},
            {"id": "n4", "type": "update_record", "label": "Mark Verified", "position": {"x": 650, "y": 100}, "config": {"status": "verified"}},
            {"id": "n5", "type": "notification", "label": "Notify Compliance", "position": {"x": 650, "y": 300}, "config": {"channels": ["email"]}},
            {"id": "n6", "type": "end", "label": "End", "position": {"x": 850, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Yes", "condition": "approved"},
            {"id": "e4", "source": "n3", "target": "n5", "label": "No", "condition": "rejected"},
            {"id": "e5", "source": "n4", "target": "n6"},
            {"id": "e6", "source": "n5", "target": "n6"},
        ],
        "tags": ["finance", "compliance", "kyc", "approval"],
        "config": {"compliance_mode": True},
    },
    "retail": {
        "name": "Retail Customer Journey",
        "description": "Complete retail customer journey from prospect to loyal customer.",
        "category": "retail",
        "industry": "retail",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Prospect", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Lead", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Quote", "order": 2, "entity_type": "quote", "color": "#F59E0B"},
            {"id": "s4", "name": "Order", "order": 3, "entity_type": "invoice", "color": "#F97316"},
            {"id": "s5", "name": "Delivery", "order": 4, "entity_type": "customer", "color": "#8B5CF6"},
            {"id": "s6", "name": "Support", "order": 5, "entity_type": "ticket", "color": "#EF4444"},
            {"id": "s7", "name": "Loyalty", "order": 6, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "New Prospect", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "create_task", "label": "Follow-up Call", "position": {"x": 250, "y": 200}, "config": {"task_type": "call", "priority": "medium"}},
            {"id": "n3", "type": "whatsapp", "label": "Send Promo", "position": {"x": 450, "y": 200}, "config": {"template": "retail_promo"}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["retail", "ecommerce", "customer-journey"],
        "config": {},
    },
    "real_estate": {
        "name": "Real Estate Sales Pipeline",
        "description": "Property sales workflow for real estate agencies.",
        "category": "real_estate",
        "industry": "real_estate",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Inquiry", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Site Visit", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Negotiation", "order": 2, "entity_type": "deal", "color": "#F59E0B"},
            {"id": "s4", "name": "Booking", "order": 3, "entity_type": "deal", "color": "#F97316"},
            {"id": "s5", "name": "Documentation", "order": 4, "entity_type": "deal", "color": "#8B5CF6"},
            {"id": "s6", "name": "Closed", "order": 5, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "New Inquiry", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "assign_owner", "label": "Assign Agent", "position": {"x": 250, "y": 200}, "config": {"assignment_type": "round_robin", "team": "Sales"}},
            {"id": "n3", "type": "notification", "label": "Send Property Details", "position": {"x": 450, "y": 200}, "config": {"channels": ["email", "whatsapp"]}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["real-estate", "property", "sales"],
        "config": {},
    },
    "manufacturing": {
        "name": "Manufacturing Order Workflow",
        "description": "End-to-end manufacturing order processing workflow.",
        "category": "manufacturing",
        "industry": "manufacturing",
        "entity_type": "deal",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "RFQ", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Quote", "order": 1, "entity_type": "quote", "color": "#3B82F6"},
            {"id": "s3", "name": "Order", "order": 2, "entity_type": "deal", "color": "#F59E0B"},
            {"id": "s4", "name": "Production", "order": 3, "entity_type": "project", "color": "#F97316"},
            {"id": "s5", "name": "QC", "order": 4, "entity_type": "task", "color": "#8B5CF6"},
            {"id": "s6", "name": "Dispatch", "order": 5, "entity_type": "invoice", "color": "#10B981"},
            {"id": "s7", "name": "Delivered", "order": 6, "entity_type": "customer", "color": "#14B8A6"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "RFQ Received", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "approval", "label": "Quote Approval", "position": {"x": 250, "y": 200}, "config": {"approval_type": "sequential", "required_approvers": 2}},
            {"id": "n3", "type": "create_task", "label": "Production Planning", "position": {"x": 450, "y": 200}, "config": {"task_type": "production", "priority": "high"}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["manufacturing", "production", "order"],
        "config": {},
    },
    "education": {
        "name": "Education Enrollment Workflow",
        "description": "Student enrollment and management workflow for educational institutions.",
        "category": "education",
        "industry": "education",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Inquiry", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Application", "order": 1, "entity_type": "lead", "color": "#3B82F6"},
            {"id": "s3", "name": "Assessment", "order": 2, "entity_type": "lead", "color": "#F59E0B"},
            {"id": "s4", "name": "Interview", "order": 3, "entity_type": "lead", "color": "#F97316"},
            {"id": "s5", "name": "Admission", "order": 4, "entity_type": "customer", "color": "#10B981"},
            {"id": "s6", "name": "Enrolled", "order": 5, "entity_type": "customer", "color": "#14B8A6"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Inquiry", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "email", "label": "Send Application Form", "position": {"x": 250, "y": 200}, "config": {"template": "application_form"}},
            {"id": "n3", "type": "create_task", "label": "Schedule Interview", "position": {"x": 450, "y": 200}, "config": {"task_type": "interview", "priority": "high"}},
            {"id": "n4", "type": "notification", "label": "Send Admission Letter", "position": {"x": 650, "y": 200}, "config": {"channels": ["email"]}},
            {"id": "n5", "type": "end", "label": "End", "position": {"x": 850, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
            {"id": "e4", "source": "n4", "target": "n5"},
        ],
        "tags": ["education", "enrollment", "student"],
        "config": {},
    },
    "insurance": {
        "name": "Insurance Claims Workflow",
        "description": "Insurance claim processing with multi-level approval.",
        "category": "insurance",
        "industry": "insurance",
        "entity_type": "ticket",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Claim Filed", "order": 0, "entity_type": "ticket", "color": "#6366F1"},
            {"id": "s2", "name": "Document Review", "order": 1, "entity_type": "ticket", "color": "#3B82F6"},
            {"id": "s3", "name": "Assessment", "order": 2, "entity_type": "ticket", "color": "#F59E0B"},
            {"id": "s4", "name": "Approval", "order": 3, "entity_type": "ticket", "color": "#F97316"},
            {"id": "s5", "name": "Payout", "order": 4, "entity_type": "invoice", "color": "#10B981"},
            {"id": "s6", "name": "Closed", "order": 5, "entity_type": "ticket", "color": "#14B8A6"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Claim Filed", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "approval", "label": "Document Verification", "position": {"x": 250, "y": 200}, "config": {"approval_type": "sequential", "required_approvers": 2}},
            {"id": "n3", "type": "condition", "label": "Verified?", "position": {"x": 450, "y": 200}, "config": {}},
            {"id": "n4", "type": "update_record", "label": "Approve Claim", "position": {"x": 650, "y": 100}, "config": {"status": "approved"}},
            {"id": "n5", "type": "notification", "label": "Notify Rejection", "position": {"x": 650, "y": 300}, "config": {"channels": ["email", "sms"]}},
            {"id": "n6", "type": "end", "label": "End", "position": {"x": 850, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Yes", "condition": "approved"},
            {"id": "e4", "source": "n3", "target": "n5", "label": "No", "condition": "rejected"},
            {"id": "e5", "source": "n4", "target": "n6"},
            {"id": "e6", "source": "n5", "target": "n6"},
        ],
        "tags": ["insurance", "claims", "approval"],
        "config": {},
    },
    "hospitality": {
        "name": "Hospitality Guest Journey",
        "description": "Guest experience workflow for hotels and hospitality businesses.",
        "category": "hospitality",
        "industry": "hospitality",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Inquiry", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Booking", "order": 1, "entity_type": "deal", "color": "#3B82F6"},
            {"id": "s3", "name": "Check-in", "order": 2, "entity_type": "customer", "color": "#F59E0B"},
            {"id": "s4", "name": "Stay", "order": 3, "entity_type": "customer", "color": "#8B5CF6"},
            {"id": "s5", "name": "Check-out", "order": 4, "entity_type": "invoice", "color": "#F97316"},
            {"id": "s6", "name": "Follow-up", "order": 5, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Booking Inquiry", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "create_task", "label": "Room Assignment", "position": {"x": 250, "y": 200}, "config": {"task_type": "assignment", "priority": "high"}},
            {"id": "n3", "type": "notification", "label": "Send Confirmation", "position": {"x": 450, "y": 200}, "config": {"channels": ["email", "whatsapp"]}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["hospitality", "hotel", "guest"],
        "config": {},
    },
    "law_firm": {
        "name": "Legal Case Management Workflow",
        "description": "Case management workflow for law firms and legal departments.",
        "category": "law_firm",
        "industry": "law_firm",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Consultation", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Case Opening", "order": 1, "entity_type": "customer", "color": "#3B82F6"},
            {"id": "s3", "name": "Discovery", "order": 2, "entity_type": "task", "color": "#F59E0B"},
            {"id": "s4", "name": "Filing", "order": 3, "entity_type": "task", "color": "#F97316"},
            {"id": "s5", "name": "Hearing", "order": 4, "entity_type": "task", "color": "#8B5CF6"},
            {"id": "s6", "name": "Resolution", "order": 5, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Consultation Request", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "assign_owner", "label": "Assign Attorney", "position": {"x": 250, "y": 200}, "config": {"assignment_type": "manager", "department": "Legal"}},
            {"id": "n3", "type": "create_task", "label": "Create Case File", "position": {"x": 450, "y": 200}, "config": {"task_type": "documentation", "priority": "high"}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["legal", "law-firm", "case-management"],
        "config": {},
    },
    "digital_marketing": {
        "name": "Digital Marketing Campaign Workflow",
        "description": "Campaign management workflow for digital marketing agencies.",
        "category": "digital_marketing",
        "industry": "digital_marketing",
        "entity_type": "lead",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Lead", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Onboarding", "order": 1, "entity_type": "customer", "color": "#3B82F6"},
            {"id": "s3", "name": "Strategy", "order": 2, "entity_type": "deal", "color": "#F59E0B"},
            {"id": "s4", "name": "Execution", "order": 3, "entity_type": "project", "color": "#F97316"},
            {"id": "s5", "name": "Reporting", "order": 4, "entity_type": "customer", "color": "#8B5CF6"},
            {"id": "s6", "name": "Retainer", "order": 5, "entity_type": "customer", "color": "#10B981"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "New Client", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "create_task", "label": "Create Campaign Plan", "position": {"x": 250, "y": 200}, "config": {"task_type": "planning", "priority": "high"}},
            {"id": "n3", "type": "notification", "label": "Send Welcome Kit", "position": {"x": 450, "y": 200}, "config": {"channels": ["email"]}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["marketing", "agency", "campaign"],
        "config": {},
    },
    "logistics": {
        "name": "Logistics & Supply Chain Workflow",
        "description": "End-to-end logistics workflow for supply chain management.",
        "category": "logistics",
        "industry": "logistics",
        "entity_type": "deal",
        "is_built_in": True,
        "stages": [
            {"id": "s1", "name": "Inquiry", "order": 0, "entity_type": "lead", "color": "#6366F1"},
            {"id": "s2", "name": "Quote", "order": 1, "entity_type": "quote", "color": "#3B82F6"},
            {"id": "s3", "name": "Booking", "order": 2, "entity_type": "deal", "color": "#F59E0B"},
            {"id": "s4", "name": "Pickup", "order": 3, "entity_type": "task", "color": "#F97316"},
            {"id": "s5", "name": "In Transit", "order": 4, "entity_type": "task", "color": "#8B5CF6"},
            {"id": "s6", "name": "Delivered", "order": 5, "entity_type": "customer", "color": "#10B981"},
            {"id": "s7", "name": "Invoiced", "order": 6, "entity_type": "invoice", "color": "#14B8A6"},
        ],
        "nodes": [
            {"id": "n1", "type": "start", "label": "Shipping Inquiry", "position": {"x": 50, "y": 200}, "config": {}},
            {"id": "n2", "type": "assign_owner", "label": "Assign Logistics Coordinator", "position": {"x": 250, "y": 200}, "config": {"assignment_type": "least_busy", "department": "Logistics"}},
            {"id": "n3", "type": "notification", "label": "Send Tracking Info", "position": {"x": 450, "y": 200}, "config": {"channels": ["email", "sms"]}},
            {"id": "n4", "type": "end", "label": "End", "position": {"x": 650, "y": 200}, "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"},
        ],
        "tags": ["logistics", "supply-chain", "shipping"],
        "config": {},
    },
}


def seed_built_in_templates():
    db = get_db()
    existing_count = db.workflow_templates.count_documents({"is_built_in": True})
    if existing_count > 0:
        return
    for category, template in BUILT_IN_TEMPLATES.items():
        doc = {**template, "created_at": utcnow(), "updated_at": utcnow()}
        db.workflow_templates.insert_one(doc)


def create_template(data, created_by):
    db = get_db()
    doc = {
        "name": data["name"],
        "description": data.get("description"),
        "category": data["category"],
        "industry": data.get("industry"),
        "entity_type": data["entity_type"],
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "stages": data.get("stages", []),
        "tags": data.get("tags", []),
        "is_built_in": data.get("is_built_in", False),
        "config": data.get("config", {}),
        "created_by": created_by,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = db.workflow_templates.insert_one(doc)
    doc["_id"] = result.inserted_id
    record_audit_log(created_by, "create", "workflow_template", str(doc["_id"]), changes=doc)
    return doc


def get_template_by_id(template_id):
    db = get_db()
    tpl = db.workflow_templates.find_one({"_id": to_object_id(template_id)})
    if not tpl:
        raise NotFoundError("Workflow template not found.")
    return tpl


def list_templates(filters, skip, limit):
    db = get_db()
    query = {}
    if filters.get("category"):
        query["category"] = filters["category"]
    if filters.get("entity_type"):
        query["entity_type"] = filters["entity_type"]
    if filters.get("industry"):
        query["industry"] = filters["industry"]
    if filters.get("search"):
        query["$or"] = [
            {"name": {"$regex": filters["search"], "$options": "i"}},
            {"description": {"$regex": filters["search"], "$options": "i"}},
        ]
    total = db.workflow_templates.count_documents(query)
    cursor = db.workflow_templates.find(query).sort("name", 1).skip(skip).limit(limit)
    return list(cursor), total


def update_template(template_id, data, updated_by):
    db = get_db()
    existing = get_template_by_id(template_id)
    if existing.get("is_built_in"):
        raise ValueError("Built-in templates cannot be modified.")
    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utcnow()
    db.workflow_templates.update_one({"_id": to_object_id(template_id)}, {"$set": update_fields})
    updated = get_template_by_id(template_id)
    record_audit_log(
        updated_by, "update", "workflow_template", template_id,
        changes={"before": {k: existing.get(k) for k in update_fields}, "after": update_fields},
    )
    return updated


def delete_template(template_id, deleted_by):
    db = get_db()
    existing = get_template_by_id(template_id)
    if existing.get("is_built_in"):
        raise ValueError("Built-in templates cannot be deleted.")
    db.workflow_templates.delete_one({"_id": to_object_id(template_id)})
    record_audit_log(deleted_by, "delete", "workflow_template", template_id, changes={"deleted_doc": existing})


def apply_template(template_id, created_by):
    tpl = get_template_by_id(template_id)
    from app.services.workflow_service import create_workflow
    wf_data = {
        "name": tpl["name"],
        "description": tpl.get("description"),
        "category": tpl.get("category", "custom"),
        "entity_type": tpl["entity_type"],
        "nodes": tpl.get("nodes", []),
        "edges": tpl.get("edges", []),
        "stages": tpl.get("stages", []),
        "tags": tpl.get("tags", []),
        "config": tpl.get("config", {}),
        "status": "draft",
    }
    return create_workflow(wf_data, created_by)
