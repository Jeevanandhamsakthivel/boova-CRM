"""
Production-grade SMTP email delivery service.
Supports HTML emails, template variables, file attachments,
connection retry with backoff, CC/BCC, delivery status tracking,
and per-user SMTP overrides stored in user-scoped settings.
"""
import time
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.utils import formataddr, formatdate
from email import encoders
from flask import current_app

from app.db import get_db

logger = logging.getLogger(__name__)

_USER_SMTP_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_password",
                   "smtp_from_name", "smtp_from_email", "smtp_use_tls"]


def _get_user_smtp_settings(user_id):
    """Load user-scoped SMTP settings from the database.

    Returns a dict with the same keys as ``_get_config()``, but only
    populated for values the user has overridden.
    """
    if not user_id:
        return {}
    db = get_db()
    cursor = db.settings.find({"key": {"$in": _USER_SMTP_KEYS},
                                "scope": "user",
                                "scope_id": user_id})
    overrides = {}
    for doc in cursor:
        key = doc["key"][5:]  # strip "smtp_" prefix
        overrides[key] = doc["value"]
    return overrides


def _get_config(user_id=None):
    """Read SMTP settings from Flask app config with fallbacks.

    If *user_id* is provided, any corresponding user-scoped settings
    override the global config values.
    """
    cfg = current_app.config
    base = {
        "host": cfg.get("SMTP_HOST", ""),
        "port": cfg.get("SMTP_PORT", 587),
        "user": cfg.get("SMTP_USER", ""),
        "password": cfg.get("SMTP_PASSWORD", ""),
        "use_tls": cfg.get("SMTP_USE_TLS", True),
        "from_name": cfg.get("SMTP_FROM_NAME", "PSM CRM"),
        "from_email": cfg.get("SMTP_FROM_EMAIL", "noreply@psmcrm.com"),
        "max_retries": cfg.get("SMTP_MAX_RETRIES", 3),
        "retry_delay": cfg.get("SMTP_RETRY_DELAY", 5),
        "timeout": cfg.get("SMTP_TIMEOUT", 30),
    }
    overrides = _get_user_smtp_settings(user_id)
    base.update(overrides)
    return base


def is_configured(user_id=None):
    """Return True if SMTP credentials are present.

    Checks either global config or per-user settings if *user_id* is given.
    """
    cfg = _get_config(user_id)
    return bool(cfg["host"] and cfg["user"] and cfg["password"])


def render_template(template_body, variables):
    """Simple variable substitution: {{var_name}} -> value.

    Falls back to empty string for missing variables to avoid exposing
    template syntax in the final email.
    """
    if not variables:
        return template_body
    result = template_body
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", str(value or ""))
        result = result.replace("{{ " + key + " }}", str(value or ""))
    return result


def build_html_wrapper(body):
    """Wrap plain text body in a minimal, responsive HTML template."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body {{ margin:0; padding:0; background:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }}
  .wrap {{ max-width:600px; margin:0 auto; padding:24px 16px; }}
  .card {{ background:#fff; border-radius:8px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }}
  .footer {{ text-align:center; padding:24px 0 0; font-size:12px; color:#94a3b8; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">{body}</div>
  <div class="footer">Sent via PSM CRM</div>
</div>
</body>
</html>"""


def _build_mime(to_addrs, subject, body_html, cc=None, bcc=None, attachments=None, from_name=None, from_email=None, user_id=None):
    """Construct a MIMEMultipart message."""
    cfg = _get_config(user_id)
    fname = from_name or cfg["from_name"]
    faddr = from_email or cfg["from_email"]

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((fname, faddr))
    msg["To"] = ", ".join(to_addrs) if isinstance(to_addrs, list) else to_addrs
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    if cc:
        msg["Cc"] = ", ".join(cc) if isinstance(cc, list) else cc

    msg.attach(MIMEText(subject, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    if attachments:
        main = MIMEMultipart("mixed")
        main.attach(msg)
        for att in attachments:
            part = MIMEBase("application", "octet-stream")
            payload = att.get("content")
            if isinstance(payload, str):
                payload = payload.encode("utf-8")
            part.set_payload(payload)
            encoders.encode_base64(part)
            filename = att.get("filename", "attachment")
            part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
            main.attach(part)
        return main

    return msg


def _collect_recipients(to_addrs, cc=None, bcc=None):
    """Merge To, CC, BCC into a single deduplicated list of SMTP recipients."""
    recipients = list(to_addrs) if isinstance(to_addrs, list) else [to_addrs]
    if cc:
        recipients.extend(cc if isinstance(cc, list) else [cc])
    if bcc:
        recipients.extend(bcc if isinstance(bcc, list) else [bcc])
    seen = set()
    return [r for r in recipients if not (r in seen or seen.add(r))]


def _send_smtp(msg, recipients, user_id=None):
    """Low-level SMTP send with TLS and retry logic."""
    cfg = _get_config(user_id)
    last_error = None

    for attempt in range(1, cfg["max_retries"] + 1):
        try:
            with smtplib.SMTP(cfg["host"], cfg["port"], timeout=cfg["timeout"]) as server:
                server.ehlo()
                if cfg["use_tls"]:
                    server.starttls()
                    server.ehlo()
                server.login(cfg["user"], cfg["password"])
                server.sendmail(cfg["from_email"], recipients, msg.as_string())
            logger.info("Email sent to %d recipient(s) on attempt %d/%d",
                        len(recipients), attempt, cfg["max_retries"])
            return True
        except (smtplib.SMTPException, OSError, ConnectionError) as exc:
            last_error = exc
            logger.warning("SMTP attempt %d/%d failed: %s", attempt, cfg["max_retries"], exc)
            if attempt < cfg["max_retries"]:
                time.sleep(cfg["retry_delay"] * attempt)

    logger.error("Email delivery failed after %d attempts: %s", cfg["max_retries"], last_error)
    return False


def send(to_addrs, subject, body, cc=None, bcc=None, attachments=None,
         variables=None, html=True, from_name=None, from_email=None,
         user_id=None):
    """Send an email via SMTP.

    Parameters:
        to_addrs (list[str]): Recipient email addresses.
        subject (str): Email subject.
        body (str): Body content (plain text or HTML depending on *html*).
        cc (list[str] | None): CC recipients.
        bcc (list[str] | None): BCC recipients.
        attachments (list[dict] | None): Each dict with keys ``content`` (str/bytes) and ``filename``.
        variables (dict | None): Template variables for ``{{var}}`` substitution.
        html (bool): If True, *body* is treated as HTML; otherwise it is wrapped in HTML.
        from_name (str | None): Override sender display name.
        from_email (str | None): Override sender email address.
        user_id (str | None): Optional user ID to load per-user SMTP settings.

    Returns:
        dict: ``{"delivered": bool, "recipients_count": int, "error": str | None}``
    """
    if not is_configured(user_id):
        return {"delivered": False, "recipients_count": 0,
                "error": "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD."}

    rendered_body = render_template(body, variables or {})
    final_html = rendered_body if html else build_html_wrapper(rendered_body)

    msg = _build_mime(to_addrs, subject, final_html, cc=cc, bcc=bcc,
                      attachments=attachments, from_name=from_name, from_email=from_email,
                      user_id=user_id)
    recipients = _collect_recipients(to_addrs, cc=cc, bcc=bcc)

    delivered = _send_smtp(msg, recipients, user_id=user_id)
    return {
        "delivered": delivered,
        "recipients_count": len(recipients),
        "error": None if delivered else "SMTP delivery failed after retries",
    }
