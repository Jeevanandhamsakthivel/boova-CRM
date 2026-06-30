import { useState, useMemo } from "react";
import { emailApi } from "../api/emailApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";
import { IconMail, IconInbox, IconPlus } from "../components/ui/Icons";

export default function EmailInboxPage() {
    const toast = useToast();
    const [showCompose, setShowCompose] = useState(false);
    const [direction, setDirection] = useState("");

    const { items: emails, meta, loading, reload, updateParams } = usePaginatedList(
        emailApi.list,
        { direction, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    const stats = useMemo(() => {
        const total = meta.total_count || 0;
        const inbound = emails.filter(e => e.direction === "inbound").length;
        const outbound = emails.filter(e => e.direction === "outbound").length;
        return { total, inbound, outbound, draft: 0 };
    }, [emails, meta]);

    function getInitials(str) {
        if (!str) return "?";
        return str.split(/[\s@]/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Email</h1>
                    <span className="page-header-subtitle">{meta.total_count} messages</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCompose(true)}><IconPlus width={14} height={14} /> Compose</Button>
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
                        <IconMail width={17} height={17} />
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

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={direction} onChange={e => { setDirection(e.target.value); applyFilter({ direction: e.target.value }); }}>
                        <option value="">All mail</option>
                        <option value="inbound">Inbox</option>
                        <option value="outbound">Sent</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : emails.length === 0 ? (
                <div className="empty-state">
                    <IconMail width={40} height={40} />
                    <h3>No emails found</h3>
                    <p>Connect your inbox to start logging emails.</p>
                    <Button onClick={() => setShowCompose(true)} style={{ marginTop: 8 }}>Compose Email</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 240 }}>Sender / Recipient</th>
                                <th>Subject</th>
                                <th style={{ width: 100 }}>Direction</th>
                                <th style={{ width: 160 }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map(e => (
                                <tr key={e.id} className="email-row">
                                    <td>
                                        <div className="email-sender">
                                            <span className="email-avatar">{getInitials(e.direction === "inbound" ? e.from : (e.to || []).join(", "))}</span>
                                            <span style={{ fontSize: 13, color: "var(--ink-700)", fontWeight: 500 }}>
                                                {e.direction === "inbound" ? e.from || "—" : (e.to || []).join(", ")}
                                            </span>
                                        </div>
                                    </td>
                                    <td><span className="email-subject" style={{ fontWeight: 500, color: "var(--ink-900)", fontSize: 13.5 }}>{e.subject}</span></td>
                                    <td><span className={`email-badge email-badge-${e.direction === "inbound" ? "inbound" : "outbound"}`}>{e.direction}</span></td>
                                    <td className="cell-muted">{formatDateTime(e.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Email" maxWidth={600}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">To <span className="required">*</span></label>
                        <input className="field-input" placeholder="recipient@example.com" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Subject <span className="required">*</span></label>
                        <input className="field-input" placeholder="Email subject" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Body</label>
                        <textarea className="field-input" rows={8} placeholder="Write your email..." style={{ minHeight: 180 }} />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowCompose(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Email sent (demo)."); setShowCompose(false); }}>Send</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
