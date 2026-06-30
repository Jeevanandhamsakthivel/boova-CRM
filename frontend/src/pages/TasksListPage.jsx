import { useState } from "react";
import { tasksApi } from "../api/tasksApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TaskFormModal } from "../components/features/TaskFormModal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errorUtils";
import { formatDate } from "../utils/formatters";
import { IconPlus, IconCheck } from "../components/ui/Icons";

export default function TasksListPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const { items: tasks, meta, loading, reload, updateParams, setItems } = usePaginatedList(
        tasksApi.list,
        { status: statusFilter, priority: priorityFilter, page: 1, per_page: 25 }
    );

    async function handleStatusToggle(task) {
        const next = task.status === "completed" ? "todo" : "completed";
        setItems(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
        try {
            await tasksApi.update(task.id, { status: next });
        } catch (err) {
            setItems(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
            toast.error(getErrorMessage(err));
        }
    }

    const PRIORITY_ACCENT = { low: "var(--ink-400)", medium: "var(--warning)", high: "var(--danger)", urgent: "#7C3AED" };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, margin:0, letterSpacing:"-0.02em" }}>Tasks</h1>
                    <span className="page-header-subtitle">{meta.total_count} tasks</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus width={14} height={14} /> New Task
                    </Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom:16 }}>
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width:160 }} value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); updateParams({ status: e.target.value, page: 1 }); }}>
                        <option value="">All statuses</option>
                        {["todo","in_progress","completed","cancelled"].map(s => (
                            <option key={s} value={s}>{s.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")}</option>
                        ))}
                    </select>
                    <select className="field-select" style={{ width:150 }} value={priorityFilter}
                        onChange={e => { setPriorityFilter(e.target.value); updateParams({ priority: e.target.value, page: 1 }); }}>
                        <option value="">All priorities</option>
                        {["low","medium","high","urgent"].map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{width:28,height:28}} /></div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <h3>No tasks found</h3>
                    <Button onClick={() => setShowCreate(true)} style={{marginTop:8}}><IconPlus width={14} height={14}/> New Task</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{width:36}}></th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                                <th>Assigned To</th>
                                <th>Related To</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => {
                                const done = task.status === "completed" || task.status === "cancelled";
                                const overdue = task.due_date && new Date(task.due_date) < new Date() && !done;
                                return (
                                    <tr key={task.id}>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-icon btn-sm"
                                                style={{ color: done ? "var(--success)" : "var(--ink-200)", width:28, height:28 }}
                                                onClick={() => handleStatusToggle(task)}
                                                title={done ? "Mark incomplete" : "Mark complete"}
                                            >
                                                <IconCheck width={14} height={14} />
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight:600, color: done ? "var(--ink-400)" : "var(--ink-900)", fontSize:13.5, textDecoration: done ? "line-through" : "none" }}>
                                                {task.title}
                                            </div>
                                            {task.description && <div style={{ fontSize:11.5, color:"var(--ink-400)" }}>{task.description.slice(0,60)}{task.description.length>60?"…":""}</div>}
                                        </td>
                                        <td><StatusBadge status={task.status} /></td>
                                        <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                                <div style={{ width:8, height:8, borderRadius:"50%", background: PRIORITY_ACCENT[task.priority]||"var(--ink-200)", flexShrink:0 }} />
                                                <span style={{ fontSize:12.5, color:"var(--ink-600)", textTransform:"capitalize" }}>{task.priority||"—"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {task.due_date ? (
                                                <span style={{ fontSize:12.5, color: overdue ? "var(--danger)" : "var(--ink-600)", fontWeight: overdue ? 600 : 400 }}>
                                                    {overdue && "⚠ "}{formatDate(task.due_date)}
                                                </span>
                                            ) : <span className="cell-muted">—</span>}
                                        </td>
                                        <td className="cell-muted" style={{fontSize:12.5}}>{task.assigned_to||"—"}</td>
                                        <td className="cell-muted" style={{fontSize:12.5}}>
                                            {task.related_to ? `${task.related_to.type} · ${task.related_to.id?.slice(-6)}` : "—"}
                                        </td>
                                        <td className="cell-muted" style={{fontSize:12.5}}>{formatDate(task.created_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task">
                <TaskFormModal
                    onCreated={() => { setShowCreate(false); reload(); toast.success("Task created."); }}
                    onCancel={() => setShowCreate(false)}
                />
            </Modal>
        </div>
    );
}
