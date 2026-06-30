"""
Service layer for Unified Customer Workspace (aggregated endpoint).
Assembles customer, recent activities, and summary counts in one pass.
"""
from app.db import get_db
from app.services import customer_service, activity_service
from app.utils.helpers import serialize_doc


def get_workspace_data(customer_id):
    """
    Returns a dict with:
      - customer: full customer doc
      - recent_activities: 20 most recent activity docs
      - summary: { open_tasks_count, active_deals_count, pending_followups_count, lifetime_value }
    Raises NotFoundError if the customer does not exist.
    """
    db = get_db()

    customer = customer_service.get_customer_by_id(customer_id)

    activities, _ = activity_service.list_activities_for_entity(
        "customer", customer_id, skip=0, limit=20
    )

    open_tasks_count = db.tasks.count_documents({
        "related_to.type": "customer",
        "related_to.id": customer_id,
        "status": {"$in": ["todo", "in_progress"]},
    })

    active_deals_count = db.deals.count_documents({
        "customer_id": customer_id,
        "status": "open",
    })

    pending_followups_count = db.followups.count_documents({
        "related_to.type": "customer",
        "related_to.id": customer_id,
        "status": "pending",
    })

    return {
        "customer": customer,
        "recent_activities": activities,
        "summary": {
            "open_tasks_count": open_tasks_count,
            "active_deals_count": active_deals_count,
            "pending_followups_count": pending_followups_count,
            "lifetime_value": customer.get("lifetime_value", 0),
        },
    }
