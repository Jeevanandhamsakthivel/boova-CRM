import { useState } from "react";
import { ticketsApi } from "../api/ticketsApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/formatters";
import { IconPlus, IconSearch } from "../components/ui/Icons";
import { TicketFormModal } from "../components/features/TicketFormModal";

export default function TicketsPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");

    const { items: tickets, meta, loading, reload, updateParams } = usePaginatedList(
        ticketsApi.list,
        { status, priority, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Support Tickets</h1>
                    <span className="page-header-subtitle">{meta.total_count} tickets</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> New Ticket</Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["new", "open", "in_progress", "waiting_on_customer", "resolved", "closed"].map(s => (<option key={s} value={s}>{s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>))}
                    </select>
                    <select className="field-select" style={{ width: 140 }} value={priority} onChange={e => { setPriority(e.target.value); applyFilter({ priority: e.target.value }); }}>
                        <option value="">All priorities</option>
                        {["low", "medium", "high", "urgent"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : tickets.length === 0 ? (
                <div className="empty-state">
                    <h3>No tickets found</h3>
                    <p>Create your first support ticket.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Ticket</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Channel</th>
                                <th>Category</th>
                                <th>Owner</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{t.subject}</td>
                                    <td><StatusBadge status={t.status} /></td>
                                    <td><StatusBadge status={t.priority} /></td>
                                    <td className="cell-muted">{t.channel || "—"}</td>
                                    <td className="cell-muted">{t.category || "—"}</td>
                                    <td className="cell-muted">{t.assigned_to || "—"}</td>
                                    <td className="cell-muted">{formatDate(t.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Ticket" maxWidth={600}>
                <TicketFormModal onCreated={() => { setShowCreate(false); reload(); toast.success("Ticket created."); }} onCancel={() => setShowCreate(false)} />
            </Modal>
        </div>
    );
}
