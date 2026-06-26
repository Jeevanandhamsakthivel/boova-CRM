"""
JWT token blocklist, so /auth/logout can actually invalidate a token
(SRS Chapter 36: JWT Authentication).
"""
from app.db import get_db
from app.utils.helpers import utcnow


def add_token_to_blocklist(jti):
    db = get_db()
    db.token_blocklist.insert_one({"jti": jti, "created_at": utcnow()})


def is_token_revoked(jti):
    db = get_db()
    return db.token_blocklist.find_one({"jti": jti}) is not None