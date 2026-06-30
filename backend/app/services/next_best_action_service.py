"""Next Best Action Suggestions (5.3) based on real signals."""
from datetime import datetime, timezone, timedelta
from app.db import get_db


def get_suggestions(entity_type, entity_id, entity_data=None):
    """Return 1-3 suggested actions based on entity state and activity history."""
    db = get_db()
    suggestions = []
    now = datetime.now(timezone.utc)

    if entity_type == "contact" or entity_type == "customer":
        entity_id_str = entity_id
        entity = entity_data or db.customers.find_one({"_id": entity_id_str}) if entity_id_str else None
        if not entity:
            return suggestions

        last_activity = db.activities.find_one(
            {"related_to.type": "customer", "related_to.id": entity_id_str},
            sort=[("created_at", -1)],
        )

        open_deals = list(db.deals.find({"customer_id": entity_id_str, "status": "open"}))
        pending_followups = list(db.followups.find({
            "related_to.type": "customer", "related_to.id": entity_id_str, "status": "pending",
        }))
        open_tickets = list(db.tickets.find({"customer_id": entity_id_str, "status": {"$nin": ["resolved", "closed"]}}))

        if not last_activity or (now - last_activity["created_at"]).days > 7:
            suggestions.append({
                "action": "reach_out",
                "label": "No recent activity",
                "description": f"No interaction in {(now - last_activity['created_at']).days if last_activity else 30}+ days. Send a check-in email.",
                "priority": "high",
            })

        for deal in open_deals:
            if deal.get("next_step"):
                suggestions.append({
                    "action": "follow_deal",
                    "label": f"Next step: {deal['title']}",
                    "description": deal["next_step"],
                    "priority": "medium",
                    "deal_id": str(deal["_id"]),
                })

        if not pending_followups:
            suggestions.append({
                "action": "schedule_followup",
                "label": "Schedule a follow-up",
                "description": "No pending follow-ups for this customer.",
                "priority": "medium",
            })

        if open_tickets:
            urgent_tickets = [t for t in open_tickets if t.get("priority") == "urgent"]
            if urgent_tickets:
                suggestions.append({
                    "action": "resolve_ticket",
                    "label": f"{len(urgent_tickets)} urgent ticket(s) open",
                    "description": f"Ticket: {urgent_tickets[0]['subject']}",
                    "priority": "high",
                })
            else:
                suggestions.append({
                    "action": "check_tickets",
                    "label": f"{len(open_tickets)} open ticket(s)",
                    "description": "Customer has unresolved support tickets.",
                    "priority": "medium",
                })

    elif entity_type == "lead":
        lead = entity_data or db.leads.find_one({"_id": entity_id}) if entity_id else None
        if not lead:
            return suggestions

        days_since_creation = (now - lead.get("created_at", now)).days
        if lead.get("status") == "new" and days_since_creation > 2:
            suggestions.append({
                "action": "contact_lead",
                "label": "Contact new lead",
                "description": f"Lead '{lead.get('name')}' has been new for {days_since_creation} days.",
                "priority": "high",
            })
        if lead.get("status") == "contacted" and days_since_creation > 7:
            suggestions.append({
                "action": "qualify_lead",
                "label": "Qualify or follow up",
                "description": f"Lead was created {days_since_creation} days ago. Consider qualifying or moving to the next stage.",
                "priority": "medium",
            })

    elif entity_type == "deal":
        deal = entity_data or db.deals.find_one({"_id": entity_id}) if entity_id else None
        if not deal:
            return suggestions

        if not deal.get("next_step"):
            suggestions.append({
                "action": "define_next_step",
                "label": "Define next step",
                "description": "This deal has no defined next step.",
                "priority": "medium",
            })
        if deal.get("expected_close_date"):
            days_until_close = (deal["expected_close_date"] - now).days
            if days_until_close < 0:
                suggestions.append({
                    "action": "update_deal",
                    "label": "Past expected close date",
                    "description": f"This deal was expected to close {abs(days_until_close)} days ago.",
                    "priority": "high",
                })

    return suggestions[:3]
