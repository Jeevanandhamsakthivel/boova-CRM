"""Lightweight migration and import helpers for CRM onboarding."""
from __future__ import annotations

from typing import Any, Iterable


def clean_import_payload(records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalize casing, trim whitespace, and remove duplicate records by email."""
    cleaned: list[dict[str, Any]] = []
    seen_emails: set[str] = set()

    for record in records:
        if not isinstance(record, dict):
            continue

        normalized = dict(record)
        name = (normalized.get("name") or "").strip()
        company = (normalized.get("company") or "").strip()
        email = (normalized.get("email") or "").strip().lower()
        phone = (normalized.get("phone") or "").strip()

        normalized["name"] = name
        normalized["company"] = company
        normalized["email"] = email
        normalized["phone"] = phone

        if email and email in seen_emails:
            continue
        if email:
            seen_emails.add(email)

        cleaned.append(normalized)

    return cleaned
