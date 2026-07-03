import { useEffect, useState } from "react";
import { usersApi } from "../api/miscApi";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const ROLE_CLASS = { admin: "badge-danger", manager: "badge-warning", agent: "badge-neutral" };

export default function UsersListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    function load() {
        setLoading(true);
        usersApi.list({ search })
            .then(r => setUsers(r.data.data || []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }

    useEffect(load, [search]);

    async function handleRoleChange(id, role) {
        await usersApi.update(id, { role });
        load();
    }

    async function handleDelete() {
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        await usersApi.remove(id);
        load();
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Users</h1>
                    <span className="page-header-subtitle">Manage team members</span>
                </div>
            </div>

            <div className="toolbar">
                <input className="field-input" style={{ width: 260 }} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : users.length === 0 ? (
                <div className="empty-state"><h3>No users found</h3></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Active</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ cursor: "default" }}>
                                    <td className="cell-strong">{u.full_name || u.name}</td>
                                    <td className="cell-muted">{u.email}</td>
                                    <td>
                                        <select
                                            className="field-select"
                                            style={{ fontSize: 12, padding: "4px 8px", height: "auto" }}
                                            value={u.role}
                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                        >
                                            {["agent", "manager", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.is_active ? "badge-success" : "badge-neutral"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                                    </td>
                                    <td className="cell-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(u.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmDialog
                open={!!confirmDeleteId}
                title="Delete User?"
                message="This action cannot be undone. The user will lose access to the system."
                confirmLabel="Delete"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
}
