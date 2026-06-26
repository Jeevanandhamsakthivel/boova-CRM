"""
Service layer for Search Architecture (SRS Chapter 17): a single global
search endpoint that queries Leads, Customers, Tasks, and Deals together
using the text indexes created in db.py.
"""
from app.db import get_db


def global_search(query_text, limit_per_type=5):
    db = get_db()
    regex = {"$regex": query_text, "$options": "i"}

    leads = list(
        db.leads.find({"$text": {"$search": query_text}}).limit(limit_per_type)
    ) if query_text.strip() else []

    customers = list(
        db.customers.find({"$text": {"$search": query_text}}).limit(limit_per_type)
    ) if query_text.strip() else []

    tasks = list(
        db.tasks.find({"$or": [{"title": regex}, {"description": regex}]}).limit(limit_per_type)
    )

    deals = list(
        db.deals.find({"title": regex}).limit(limit_per_type)
    )

    return {
        "leads": leads,
        "customers": customers,
        "tasks": tasks,
        "deals": deals,
    }