import { useState } from "react";
import { companiesApi } from "../api/companiesApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { IconPlus, IconSearch } from "../components/ui/Icons";
import { CompanyFormModal } from "../components/features/CompanyFormModal";

export default function CompaniesPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [industry, setIndustry] = useState("");

    const { items: companies, meta, loading, reload, updateParams } = usePaginatedList(
        companiesApi.list,
        { search, status, industry, page: 1, per_page: 20 }
    );

    function applyFilter(patch) {
        updateParams({ ...patch, page: 1 });
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Companies</h1>
                    <span className="page-header-subtitle">{meta.total_count} companies</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus width={14} height={14} /> New Company
                    </Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-filters">
                    <div style={{ position: "relative" }}>
                        <IconSearch width={14} height={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
                        <input className="field-input" style={{ width: 240, paddingLeft: 32 }} placeholder="Search companies..." value={search} onChange={e => { setSearch(e.target.value); applyFilter({ search: e.target.value }); }} />
                    </div>
                    <select className="field-select" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["active", "inactive", "prospect", "churned"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                    <select className="field-select" style={{ width: 160 }} value={industry} onChange={e => { setIndustry(e.target.value); applyFilter({ industry: e.target.value }); }}>
                        <option value="">All industries</option>
                        {["technology", "finance", "healthcare", "retail", "manufacturing", "real_estate", "education", "consulting", "media", "logistics"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : companies.length === 0 ? (
                <div className="empty-state">
                    <h3>No companies found</h3>
                    <p>Create your first company record.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Company</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Industry</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Revenue</th>
                                <th>Owner</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(c => (
                                <tr key={c.id}>
                                    <td><div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{c.name}</div>{c.domain && <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{c.domain}</div>}</td>
                                    <td className="cell-muted">{c.industry || "—"}</td>
                                    <td className="cell-muted">{c.company_size || "—"}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td style={{ fontWeight: 600, color: "var(--success)", fontSize: 13 }}>{formatCurrency(c.annual_revenue)}</td>
                                    <td className="cell-muted">{c.assigned_to || "—"}</td>
                                    <td className="cell-muted">{formatDate(c.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Company" maxWidth={600}>
                <CompanyFormModal onCreated={() => { setShowCreate(false); reload(); toast.success("Company created."); }} onCancel={() => setShowCreate(false)} />
            </Modal>
        </div>
    );
}
