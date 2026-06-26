"""
Service layer for Reports & Analytics (SRS Chapter 19).
Aggregation-based summaries across Leads, Customers, Deals, and Tasks.
"""
from datetime import datetime, timedelta
from app.db import get_db
from app.utils.helpers import utcnow


def dashboard_summary(scope_user_id=None):
    """High-level KPI cards for the Dashboard Module (SRS Chapter 9)."""
    db = get_db()
    lead_filter = {"assigned_to": scope_user_id} if scope_user_id else {}
    customer_filter = {"assigned_to": scope_user_id} if scope_user_id else {}
    deal_filter = {"assigned_to": scope_user_id} if scope_user_id else {}
    task_filter = {"assigned_to": scope_user_id} if scope_user_id else {}

    total_leads = db.leads.count_documents(lead_filter)
    new_leads = db.leads.count_documents({**lead_filter, "status": "new"})
    qualified_leads = db.leads.count_documents({**lead_filter, "status": "qualified"})

    total_customers = db.customers.count_documents(customer_filter)

    open_deals = list(db.deals.find({**deal_filter, "status": "open"}))
    open_deal_value = sum(d.get("value", 0) for d in open_deals)
    won_deals = db.deals.count_documents({**deal_filter, "status": "won"})

    pending_tasks = db.tasks.count_documents({**task_filter, "status": {"$ne": "completed"}})
    overdue_tasks = db.tasks.count_documents(
        {**task_filter, "status": {"$ne": "completed"}, "due_date": {"$lt": utcnow()}}
    )

    pending_followups = db.followups.count_documents(
        {**({"assigned_to": scope_user_id} if scope_user_id else {}), "status": "pending"}
    )

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "qualified_leads": qualified_leads,
        "total_customers": total_customers,
        "open_deals_count": len(open_deals),
        "open_deals_value": open_deal_value,
        "won_deals_count": won_deals,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
        "pending_followups": pending_followups,
    }


def leads_by_status_report():
    db = get_db()
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    return list(db.leads.aggregate(pipeline))


def leads_by_source_report():
    db = get_db()
    pipeline = [{"$group": {"_id": "$source", "count": {"$sum": 1}}}]
    return list(db.leads.aggregate(pipeline))


def deals_by_stage_report():
    db = get_db()
    pipeline = [
        {"$match": {"status": "open"}},
        {"$group": {"_id": "$stage_id", "count": {"$sum": 1}, "total_value": {"$sum": "$value"}}},
    ]
    results = list(db.deals.aggregate(pipeline))

    stages = {str(s["_id"]): s["name"] for s in db.pipeline_stages.find()}
    for r in results:
        r["stage_name"] = stages.get(r["_id"], "Unknown")
    return results


def sales_performance_report(start_date=None, end_date=None):
    db = get_db()
    match = {"status": "won"}
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        match["updated_at"] = date_filter

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": "$assigned_to",
                "deals_won": {"$sum": 1},
                "total_value": {"$sum": "$value"},
            }
        },
        {"$sort": {"total_value": -1}},
    ]
    return list(db.deals.aggregate(pipeline))


def tasks_completion_report():
    db = get_db()
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    return list(db.tasks.aggregate(pipeline))