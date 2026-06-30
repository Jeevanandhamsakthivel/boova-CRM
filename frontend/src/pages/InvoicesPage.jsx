import { useState } from "react";
import { invoicesApi } from "../api/invoicesApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { IconPlus, IconSearch } from "../components/ui/Icons";
import { InvoiceFormModal } from "../components/features/InvoiceFormModal";

export default function InvoicesPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [status, setStatus] = useState("");

    const { items: invoices, meta, loading, reload, updateParams } = usePaginatedList(
        invoicesApi.list,
        { status, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Invoices</h1>
                    <span className="page-header-subtitle">{meta.total_count} invoices</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> New Invoice</Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["draft", "sent", "paid", "partial", "overdue", "cancelled"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : invoices.length === 0 ? (
                <div className="empty-state">
                    <h3>No invoices found</h3>
                    <p>Create your first invoice.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Invoice</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13 }}>{inv.invoice_number}</td>
                                    <td className="cell-muted">{inv.customer_id || "—"}</td>
                                    <td style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(inv.total)}</td>
                                    <td style={{ color: "var(--success)", fontSize: 13 }}>{formatCurrency(inv.amount_paid)}</td>
                                    <td style={{ fontWeight: 600, color: inv.balance_due > 0 ? "var(--danger)" : "var(--success)", fontSize: 13 }}>{formatCurrency(inv.balance_due)}</td>
                                    <td><StatusBadge status={inv.status} /></td>
                                    <td className="cell-muted">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                                    <td className="cell-muted">{formatDate(inv.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Invoice" maxWidth={720}>
                <InvoiceFormModal onCreated={() => { setShowCreate(false); reload(); toast.success("Invoice created."); }} onCancel={() => setShowCreate(false)} />
            </Modal>
        </div>
    );
}
