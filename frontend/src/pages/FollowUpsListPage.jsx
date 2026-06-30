import { useState } from "react";
import { followupsApi } from "../api/followupsApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FollowUpFormModal } from "../components/features/FollowUpFormModal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errorUtils";
import { formatDate } from "../utils/formatters";
import { IconPlus, IconCheck } from "../components/ui/Icons";

const TYPE_ICON = { call:"📞", email:"✉️", meeting:"🤝", other:"📋" };

export default function FollowUpsListPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter]     = useState("");

    const { items, meta, loading, reload, updateParams, setItems } = usePaginatedList(
        followupsApi.list,
        { status: statusFilter, type: typeFilter, page: 1, per_page: 25 }
    );

    async function handleComplete(fu) {
        setItems(prev => prev.map(f => f.id === fu.id ? { ...f, status: "completed" } : f));
        try {
            await followupsApi.update(fu.id, { status: "completed" });
            toast.success("Marked complete.");
        } catch (err) {
            setItems(prev => prev.map(f => f.id === fu.id ? { ...f, status: fu.status } : f));
            toast.error(getErrorMessage(err));
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, margin:0, letterSpacing:"-0.02em" }}>Follow-ups</h1>
                    <span className="page-header-subtitle">{meta.total_count} total</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus width={14} height={14} /> Schedule Follow-up
                    </Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom:16 }}>
                <div className="toolbar-filters">
                    <select className="field-select" style={{width:160}} value={statusFilter}
                        onChange={e=>{ setStatusFilter(e.target.value); updateParams({ status:e.target.value, page:1 }); }}>
                        <option value="">All statuses</option>
                        {["pending","completed","cancelled","overdue"].map(s=>(
                            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                        ))}
                    </select>
                    <select className="field-select" style={{width:140}} value={typeFilter}
                        onChange={e=>{ setTypeFilter(e.target.value); updateParams({ type:e.target.value, page:1 }); }}>
                        <option value="">All types</option>
                        {["call","email","meeting","other"].map(t=>(
                            <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{width:28,height:28}} /></div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <h3>No follow-ups found</h3>
                    <Button onClick={()=>setShowCreate(true)} style={{marginTop:8}}><IconPlus width={14} height={14}/> Schedule one</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Assigned To</th>
                                <th>Related To</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(fu => {
                                const overdue = fu.status === "pending" && fu.due_date && new Date(fu.due_date) < new Date();
                                return (
                                    <tr key={fu.id} style={overdue ? { background:"var(--danger-tint)" } : undefined}>
                                        <td style={{ fontSize:18, width:44 }}>{TYPE_ICON[fu.type]||"📋"}</td>
                                        <td>
                                            <div style={{ fontWeight:600, color:"var(--ink-900)", fontSize:13.5 }}>{fu.title}</div>
                                            {fu.description && <div style={{ fontSize:11.5, color:"var(--ink-400)" }}>{fu.description.slice(0,60)}{fu.description.length>60?"…":""}</div>}
                                        </td>
                                        <td>
                                            <StatusBadge status={overdue ? "overdue" : fu.status} />
                                        </td>
                                        <td>
                                            <span style={{ fontSize:12.5, color: overdue ? "var(--danger)" : "var(--ink-600)", fontWeight: overdue ? 600 : 400 }}>
                                                {fu.due_date ? formatDate(fu.due_date) : "—"}
                                            </span>
                                        </td>
                                        <td className="cell-muted" style={{fontSize:12.5}}>{fu.assigned_to||"—"}</td>
                                        <td className="cell-muted" style={{fontSize:12.5}}>
                                            {fu.related_to ? `${fu.related_to.type} · ${fu.related_to.id?.slice(-6)}` : "—"}
                                        </td>
                                        <td>
                                            {fu.status === "pending" && (
                                                <button className="btn btn-ghost btn-sm" style={{ display:"flex", alignItems:"center", gap:4, color:"var(--success)" }}
                                                    onClick={()=>handleComplete(fu)}>
                                                    <IconCheck width={12} height={12} /> Done
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p=>updateParams({ page:p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Schedule Follow-up">
                <FollowUpFormModal
                    onCreated={()=>{ setShowCreate(false); reload(); toast.success("Follow-up scheduled."); }}
                    onCancel={()=>setShowCreate(false)}
                />
            </Modal>
        </div>
    );
}
