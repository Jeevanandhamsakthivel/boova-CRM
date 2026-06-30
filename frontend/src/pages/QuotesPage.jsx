import { useState } from "react";
import { quotesApi } from "../api/quotesApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { IconPlus, IconSearch } from "../components/ui/Icons";
import { QuoteFormModal } from "../components/features/QuoteFormModal";

export default function QuotesPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [status, setStatus] = useState("");

    const { items: quotes, meta, loading, reload, updateParams } = usePaginatedList(
        quotesApi.list,
        { status, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Quotes</h1>
                    <span className="page-header-subtitle">{meta.total_count} quotes</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> New Quote</Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["draft", "sent", "accepted", "rejected", "expired"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : quotes.length === 0 ? (
                <div className="empty-state">
                    <h3>No quotes found</h3>
                    <p>Create your first quote for a customer.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Quote</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Valid Until</th>
                                <th>Owner</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(q => (
                                <tr key={q.id}>
                                    <td style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{q.title}</td>
                                    <td className="cell-muted">{q.customer_id || "—"}</td>
                                    <td style={{ fontWeight: 600, color: "var(--success)", fontSize: 13 }}>{formatCurrency(q.total)}</td>
                                    <td><StatusBadge status={q.status} /></td>
                                    <td className="cell-muted">{q.valid_until ? formatDate(q.valid_until) : "—"}</td>
                                    <td className="cell-muted">{q.assigned_to || "—"}</td>
                                    <td className="cell-muted">{formatDate(q.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Quote" maxWidth={720}>
                <QuoteFormModal onCreated={() => { setShowCreate(false); reload(); toast.success("Quote created."); }} onCancel={() => setShowCreate(false)} />
            </Modal>
        </div>
    );
}
