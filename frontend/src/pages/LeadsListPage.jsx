import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leadsApi } from "../api/leadsApi";

const STATUS_COLORS = {
    new: "badge-info",
    contacted: "badge-accent",
    qualified: "badge-success",
    unqualified: "badge-danger",
    converted: "badge-success",
    lost: "badge-neutral",
};

const TEMP_CLASS = { hot: "temp-hot", warm: "temp-warm", cold: "temp-cold" };

export default function LeadsListPage() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        leadsApi.list({ search, status, page, limit })
            .then(r => {
                const d = r.data.data;
                setLeads(Array.isArray(d) ? d : d.items || []);
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            })
            .catch(() => setLeads([]))
            .finally(() => setLoading(false));
    }, [search, status, page]);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Leads</h1>
                    <span className="page-header-subtitle">{total} total leads</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <input className="field-input" style={{ width: 240 }} placeholder="Search leads…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    <select className="field-select" style={{ width: 160 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All statuses</option>
                        {["new", "contacted", "qualified", "unqualified", "converted", "lost"].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : leads.length === 0 ? (
                <div className="empty-state"><h3>No leads found</h3><p>Try adjusting your filters.</p></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Temperature</th>
                                <th>Source</th>
                                <th>Assigned To</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                                    <td className="cell-strong">{lead.name}</td>
                                    <td className="cell-muted">{lead.company || "—"}</td>
                                    <td><span className={`badge ${STATUS_COLORS[lead.status] || "badge-neutral"}`}>{lead.status}</span></td>
                                    <td>
                                        {lead.temperature && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span className={`temp-dot ${TEMP_CLASS[lead.temperature] || ""}`} />
                                                {lead.temperature}
                                            </span>
                                        )}
                                    </td>
                                    <td className="cell-muted">{lead.source || "—"}</td>
                                    <td className="cell-muted">{lead.assigned_to_name || "—"}</td>
                                    <td className="cell-muted">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-bar">
                        <span>Page {page}</span>
                        <div className="pagination-controls">
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-secondary btn-sm" disabled={leads.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
