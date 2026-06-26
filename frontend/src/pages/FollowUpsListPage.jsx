import { useEffect, useState } from "react";
import { followupsApi } from "../api/followupsApi";

const STATUS_CLASS = { scheduled: "badge-info", completed: "badge-success", missed: "badge-danger", cancelled: "badge-neutral" };

export default function FollowUpsListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        followupsApi.list({ status, page, limit })
            .then(r => {
                const d = r.data.data;
                setItems(Array.isArray(d) ? d : d.items || []);
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [status, page]);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Follow-ups</h1>
                    <span className="page-header-subtitle">{total} follow-ups</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 180 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All statuses</option>
                        {["scheduled", "completed", "missed", "cancelled"].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : items.length === 0 ? (
                <div className="empty-state"><h3>No follow-ups found</h3></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Scheduled At</th>
                                <th>Notes</th>
                                <th>Related To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(f => (
                                <tr key={f.id}>
                                    <td className="cell-strong">{f.type || "—"}</td>
                                    <td><span className={`badge ${STATUS_CLASS[f.status] || "badge-neutral"}`}>{f.status}</span></td>
                                    <td className="cell-muted">{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString() : "—"}</td>
                                    <td className="cell-muted" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.notes || "—"}</td>
                                    <td className="cell-muted">{f.related_type ? `${f.related_type} #${f.related_id}` : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-bar">
                        <span>Page {page}</span>
                        <div className="pagination-controls">
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-secondary btn-sm" disabled={items.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
