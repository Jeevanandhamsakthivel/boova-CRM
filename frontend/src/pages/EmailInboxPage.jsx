import { useState, useMemo, useCallback } from "react";
import { emailApi } from "../api/emailApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination, Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatRelative } from "../utils/formatters";
import {
    IconMail, IconInbox, IconPlus, IconSend, IconReply,
    IconForward, IconTrash2, IconEye,
} from "../components/ui/Icons";

function getInitials(str) {
    if (!str) return "?";
    return str.split(/[\s@]/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
}

function ComposeModal({ open, onClose, replyTo, onSent }) {
    const toast = useToast();
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState(() => ({
        to: replyTo ? (replyTo.from || "") : "",
        cc: replyTo ? (replyTo.cc || []).join(", ") : "",
        subject: replyTo ? `Re: ${replyTo.subject || ""}` : "",
        body: replyTo ? `\n\n--- Original message ---\n${replyTo.body || ""}` : "",
        customer_id: replyTo?.customer_id || "",
        lead_id: replyTo?.lead_id || "",
    }));

    const handleSend = useCallback(async () => {
        if (!form.to.trim()) { toast.error("Recipient is required."); return; }
        if (!form.subject.trim()) { toast.error("Subject is required."); return; }
        setSending(true);
        try {
            const payload = {
                to: form.to.split(",").map(s => s.trim()).filter(Boolean),
                cc: form.cc.split(",").map(s => s.trim()).filter(Boolean),
                subject: form.subject,
                body: form.body,
                customer_id: form.customer_id || undefined,
                lead_id: form.lead_id || undefined,
            };
            await emailApi.send(payload);
            toast.success("Email sent.");
            onSent?.();
            onClose();
        } catch {
            toast.error("Failed to send email.");
        } finally {
            setSending(false);
        }
    }, [form, toast, onSent, onClose]);

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title="Compose Email" maxWidth={640}>
            <div className="form-layout">
                <div className="field-group">
                    <label className="field-label">To <span className="required">*</span></label>
                    <input className="field-input" placeholder="recipient@example.com"
                        value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
                </div>
                <div className="field-group">
                    <label className="field-label">CC</label>
                    <input className="field-input" placeholder="cc@example.com (comma-separated)"
                        value={form.cc} onChange={e => setForm(f => ({ ...f, cc: e.target.value }))} />
                </div>
                <div className="field-group">
                    <label className="field-label">Subject <span className="required">*</span></label>
                    <input className="field-input" placeholder="Email subject"
                        value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="field-group">
                    <label className="field-label">Body</label>
                    <textarea className="field-input field-textarea" rows={10}
                        placeholder="Write your email..."
                        value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                        style={{ minHeight: 220, fontFamily: "var(--font-body)", lineHeight: 1.6 }} />
                </div>
                <div className="form-actions">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sending}>
                        {sending ? <Spinner size={16} /> : <><IconSend width={14} height={14} /> Send</>}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function EmailDetail({ email, onClose, onReply, onForward }) {
    if (!email) return null;

    const recipients = email.direction === "inbound"
        ? `From: ${email.from || "—"}`
        : `To: ${(email.to || []).join(", ")}`;

    return (
        <div className="slide-overlay-backdrop" onClick={onClose}>
            <div className="slide-overlay-panel slide-overlay-panel-right"
                onClick={e => e.stopPropagation()} style={{ width: 520 }}>
                <div className="slide-overlay-header">
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)" }}>
                        {email.subject || "(No subject)"}
                    </h3>
                    <button className="slide-overlay-close" onClick={onClose}>×</button>
                </div>
                <div className="slide-overlay-body" style={{ padding: 0 }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 4 }}>{recipients}</div>
                        {email.cc?.length > 0 && (
                            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 4 }}>
                                CC: {email.cc.join(", ")}
                            </div>
                        )}
                        <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>
                            {email.delivered !== undefined && (
                                <span style={{ color: email.delivered ? "var(--accent-green)" : "var(--accent-red)", marginRight: 12 }}>
                                    {email.delivered ? "✓ Delivered" : "✗ Failed"}
                                </span>
                            )}
                            {formatDateTime(email.created_at)}
                        </div>
                    </div>
                    <div style={{ padding: "24px", fontSize: 14, lineHeight: 1.7, color: "var(--ink-800)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {email.body || <span style={{ color: "var(--ink-400)", fontStyle: "italic" }}>No content</span>}
                    </div>
                    <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                        <Button variant="secondary" size="sm" onClick={() => onReply(email)}>
                            <IconReply width={13} height={13} /> Reply
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onForward(email)}>
                            <IconForward width={13} height={13} /> Forward
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EmailInboxPage() {
    const toast = useToast();
    const [showCompose, setShowCompose] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [direction, setDirection] = useState("");
    const [q, setQ] = useState("");
    const [selectedEmail, setSelectedEmail] = useState(null);

    const { items: emails, meta, loading, reload, updateParams } = usePaginatedList(
        emailApi.list,
        { direction, q, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    const stats = useMemo(() => {
        const total = meta.total_count || 0;
        const inbound = emails.filter(e => e.direction === "inbound").length;
        const outbound = emails.filter(e => e.direction === "outbound").length;
        return { total, inbound, outbound, draft: 0 };
    }, [emails, meta]);

    const handleComposeClose = useCallback(() => {
        setShowCompose(false);
        setReplyTo(null);
    }, []);

    const handleSent = useCallback(() => {
        applyFilter({});
        reload();
    }, [reload]);

    const handleReply = useCallback((email) => {
        setReplyTo(email);
        setSelectedEmail(null);
        setShowCompose(true);
    }, []);

    const handleForward = useCallback((email) => {
        setReplyTo({ ...email, to: "", subject: `Fwd: ${email.subject || ""}`, body: `\n\n--- Forwarded message ---\n${email.body || ""}` });
        setSelectedEmail(null);
        setShowCompose(true);
    }, []);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Email</h1>
                    <span className="page-header-subtitle">{meta.total_count} messages</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCompose(true)}>
                        <IconPlus width={14} height={14} /> Compose
                    </Button>
                </div>
            </div>

            <div className="page-stats">
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#6366F114", color: "#6366F1" }}>
                        <IconMail width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.total}</span>
                        <span className="page-stat-label">Total Messages</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#3B82F614", color: "#3B82F6" }}>
                        <IconInbox width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.inbound}</span>
                        <span className="page-stat-label">Inbox</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#F59E0B14", color: "#F59E0B" }}>
                        <IconSend width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.outbound}</span>
                        <span className="page-stat-label">Sent</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                        <IconMail width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.draft}</span>
                        <span className="page-stat-label">Drafts</span>
                    </div>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-bar-filters">
                    <select className="field-select" style={{ width: 150 }}
                        value={direction}
                        onChange={e => { setDirection(e.target.value); applyFilter({ direction: e.target.value }); }}>
                        <option value="">All mail</option>
                        <option value="inbound">Inbox</option>
                        <option value="outbound">Sent</option>
                    </select>
                    <input className="field-input" style={{ width: 220 }}
                        placeholder="Search emails..."
                        value={q} onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && applyFilter({ q: e.target.value })} />
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : emails.length === 0 ? (
                <div className="empty-state">
                    <IconMail width={40} height={40} />
                    <h3>No emails found</h3>
                    <p>Send your first email or connect an inbound webhook.</p>
                    <Button onClick={() => setShowCompose(true)} style={{ marginTop: 8 }}>Compose Email</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 240 }}>Sender / Recipient</th>
                                <th>Subject</th>
                                <th style={{ width: 90 }}>Direction</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 150 }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map(e => (
                                <tr key={e.id} className="email-row" style={{ cursor: "pointer" }}
                                    onClick={() => setSelectedEmail(e)}>
                                    <td>
                                        <div className="email-sender">
                                            <span className="email-avatar">
                                                {getInitials(e.direction === "inbound" ? e.from : (e.to || []).join(", "))}
                                            </span>
                                            <span style={{ fontSize: 13, color: "var(--ink-700)", fontWeight: 500 }}>
                                                {e.direction === "inbound"
                                                    ? (e.from_name || e.from || "—")
                                                    : (e.to || []).join(", ")}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500, color: "var(--ink-900)", fontSize: 13.5 }}>
                                            {e.subject || "(No subject)"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`email-badge email-badge-${e.direction === "inbound" ? "inbound" : "outbound"}`}>
                                            {e.direction}
                                        </span>
                                    </td>
                                    <td>
                                        {e.delivered === true && <span style={{ fontSize: 12, color: "var(--accent-green)" }}>Delivered</span>}
                                        {e.delivered === false && <span style={{ fontSize: 12, color: "var(--accent-red)" }}>Failed</span>}
                                        {e.delivered === undefined && <span style={{ fontSize: 12, color: "var(--ink-400)" }}>—</span>}
                                    </td>
                                    <td className="cell-muted" style={{ whiteSpace: "nowrap" }}>
                                        <span title={formatDateTime(e.created_at)}>
                                            {formatRelative(e.created_at)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <ComposeModal
                open={showCompose}
                onClose={handleComposeClose}
                replyTo={replyTo}
                onSent={handleSent}
            />

            {selectedEmail && (
                <EmailDetail
                    email={selectedEmail}
                    onClose={() => setSelectedEmail(null)}
                    onReply={handleReply}
                    onForward={handleForward}
                />
            )}
        </div>
    );
}
