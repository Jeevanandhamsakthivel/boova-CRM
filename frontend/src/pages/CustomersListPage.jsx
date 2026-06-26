import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../api/customersApi";

export default function CustomersListPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        customersApi.list({ search, page, limit })
            .then(r => {
                const d = r.data.data;
                setCustomers(Array.isArray(d) ? d : d.items || []);
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            })
            .catch(() => setCustomers([]))
            .finally(() => setLoading(false));
    }, [search, page]);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Customers</h1>
                    <span className="page-header-subtitle">{total} total customers</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <input className="field-input" style={{ width: 260 }} placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : customers.length === 0 ? (
                <div className="empty-state"><h3>No customers found</h3></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Company</th>
                                <th>Assigned To</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                                    <td className="cell-strong">{c.name}</td>
                                    <td className="cell-muted">{c.email || "—"}</td>
                                    <td className="cell-muted">{c.phone || "—"}</td>
                                    <td className="cell-muted">{c.company || "—"}</td>
                                    <td className="cell-muted">{c.assigned_to_name || "—"}</td>
                                    <td className="cell-muted">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-bar">
                        <span>Page {page}</span>
                        <div className="pagination-controls">
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-secondary btn-sm" disabled={customers.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
