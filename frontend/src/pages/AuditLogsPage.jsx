import { useEffect, useState } from "react";
import { auditApi } from "../api/miscApi";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 30;

    useEffect(() => {
        setLoading(true);
        auditApi.list({ page, limit })
            .then(r => {
                const d = r.data.data;
                setLogs(Array.isArray(d) ? d : d.items || []);
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            })
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Audit Logs</h1>
                    <span className="page-header-subtitle">{total} log entries</span>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : logs.length === 0 ? (
                <div className="empty-state"><h3>No audit logs yet</h3></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ cursor: "default" }}>
                                    <td className="cell-muted" style={{ whiteSpace: "nowrap" }}>
                                        {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                                    </td>
                                    <td className="cell-strong">{log.user_name || log.user_email || log.user_id || "—"}</td>
                                    <td>
                                        <span className={`badge ${log.action === "delete" ? "badge-danger" : log.action === "create" ? "badge-success" : "badge-neutral"}`}>
                                            {log.action || "—"}
                                        </span>
                                    </td>
                                    <td className="cell-muted">{log.entity_type ? `${log.entity_type} #${log.entity_id}` : "—"}</td>
                                    <td className="cell-muted" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {log.details ? JSON.stringify(log.details) : log.description || "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-bar">
                        <span>Page {page}</span>
                        <div className="pagination-controls">
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-secondary btn-sm" disabled={logs.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
