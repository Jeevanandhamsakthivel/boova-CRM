import { useState, useMemo } from "react";
import { whatsappApi } from "../api/whatsappApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";
import { IconWhatsApp, IconInbox, IconAlertTriangle, IconArrowRight, IconMail } from "../components/ui/Icons";

export default function WhatsAppPage() {
    const toast = useToast();
    const [showSend, setShowSend] = useState(false);
    const [direction, setDirection] = useState("");

    const { items: messages, meta, loading, reload, updateParams } = usePaginatedList(
        whatsappApi.list,
        { direction, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    const stats = useMemo(() => {
        const total = meta.total_count || 0;
        const inbound = messages.filter(m => m.direction === "inbound").length;
        const outbound = messages.filter(m => m.direction === "outbound").length;
        const failed = messages.filter(m => m.status === "failed").length;
        return { total, inbound, outbound, failed };
    }, [messages, meta]);

    function getStatusClass(status) {
        switch ((status || "").toLowerCase()) {
            case "sent": return "whatsapp-status-sent";
            case "delivered": return "whatsapp-status-delivered";
            case "read": return "whatsapp-status-read";
            case "failed": return "whatsapp-status-failed";
            default: return "whatsapp-status-sent";
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">WhatsApp</h1>
                    <span className="page-header-subtitle">{meta.total_count} messages</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowSend(true)}><IconMail width={14} height={14} /> Send Message</Button>
                </div>
            </div>

            <div className="page-stats">
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#25D36614", color: "#25D366" }}>
                        <IconWhatsApp width={17} height={17} />
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
                        <span className="page-stat-label">Received</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                        <IconArrowRight width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.outbound}</span>
                        <span className="page-stat-label">Sent</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#EF444414", color: "#EF4444" }}>
                        <IconAlertTriangle width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.failed}</span>
                        <span className="page-stat-label">Failed</span>
                    </div>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={direction} onChange={e => { setDirection(e.target.value); applyFilter({ direction: e.target.value }); }}>
                        <option value="">All messages</option>
                        <option value="inbound">Received</option>
                        <option value="outbound">Sent</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : messages.length === 0 ? (
                <div className="empty-state">
                    <IconWhatsApp width={40} height={40} />
                    <h3>No messages found</h3>
                    <p>Connect WhatsApp to start messaging.</p>
                    <Button onClick={() => setShowSend(true)} style={{ marginTop: 8 }}>Send a Message</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 180 }}>To / From</th>
                                <th>Message</th>
                                <th style={{ width: 100 }}>Direction</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 160 }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map(m => (
                                <tr key={m.id} className="whatsapp-row">
                                    <td style={{ fontWeight: 500, fontSize: 13, color: "var(--ink-800)" }}>{m.to || m.from || "—"}</td>
                                    <td><span className="whatsapp-message-preview" style={{ color: "var(--ink-600)" }}>{m.message}</span></td>
                                    <td><span className={`email-badge email-badge-${m.direction === "inbound" ? "inbound" : "outbound"}`}>{m.direction}</span></td>
                                    <td>
                                        <span className={`whatsapp-status-dot ${getStatusClass(m.status)}`} />
                                        <span className="cell-muted">{m.status || "—"}</span>
                                    </td>
                                    <td className="cell-muted">{formatDateTime(m.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showSend} onClose={() => setShowSend(false)} title="Send WhatsApp Message" maxWidth={500}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">To (phone number) <span className="required">*</span></label>
                        <input className="field-input" placeholder="+1234567890" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Message <span className="required">*</span></label>
                        <textarea className="field-input" rows={4} placeholder="Type your message..." />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowSend(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Message sent (demo)."); setShowSend(false); }}>Send</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
