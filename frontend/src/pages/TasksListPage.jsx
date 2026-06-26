import { useEffect, useState } from "react";
import { tasksApi } from "../api/tasksApi";

const PRIORITY_CLASS = { high: "badge-danger", medium: "badge-warning", low: "badge-neutral" };
const STATUS_CLASS = { pending: "badge-info", in_progress: "badge-accent", completed: "badge-success", cancelled: "badge-neutral" };

export default function TasksListPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    function load() {
        setLoading(true);
        tasksApi.list({ status, page, limit })
            .then(r => {
                const d = r.data.data;
                setTasks(Array.isArray(d) ? d : d.items || []);
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            })
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }

    useEffect(load, [status, page]);

    async function toggleComplete(task) {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        await tasksApi.update(task.id, { ...task, status: newStatus });
        load();
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Tasks</h1>
                    <span className="page-header-subtitle">{total} tasks</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 180 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All statuses</option>
                        {["pending", "in_progress", "completed", "cancelled"].map(s => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : tasks.length === 0 ? (
                <div className="empty-state"><h3>No tasks found</h3></div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Done</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Related To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td>
                                        <input type="checkbox" checked={task.status === "completed"} onChange={() => toggleComplete(task)} style={{ cursor: "pointer" }} />
                                    </td>
                                    <td className="cell-strong" style={{ textDecoration: task.status === "completed" ? "line-through" : "none", color: task.status === "completed" ? "var(--ink-400)" : undefined }}>
                                        {task.title}
                                    </td>
                                    <td><span className={`badge ${PRIORITY_CLASS[task.priority] || "badge-neutral"}`}>{task.priority || "—"}</span></td>
                                    <td><span className={`badge ${STATUS_CLASS[task.status] || "badge-neutral"}`}>{task.status?.replace("_", " ")}</span></td>
                                    <td className="cell-muted">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</td>
                                    <td className="cell-muted">{task.related_type ? `${task.related_type} #${task.related_id}` : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-bar">
                        <span>Page {page}</span>
                        <div className="pagination-controls">
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-secondary btn-sm" disabled={tasks.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
