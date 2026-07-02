import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { leadsApi } from "../api/leadsApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { LeadFormModal } from "../components/features/LeadFormModal";
import { ImportLeadsModal } from "../components/features/ImportLeadsModal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { IconPlus, IconSearch, IconUpload } from "../components/ui/Icons";

const TEMP_COLOR = { hot:"var(--danger)", warm:"var(--warning)", cold:"var(--info)" };
const TEMP_EMOJI = { hot:"🔥", warm:"🌤", cold:"❄️" };

export default function LeadsListPage() {
    const navigate   = useNavigate();
    const toast      = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [search, setSearch]         = useState("");
    const [status, setStatus]         = useState("");
    const [source, setSource]         = useState("");

    const { items: leads, meta, loading, reload, updateParams } = usePaginatedList(
        leadsApi.list,
        { search, status, source, page: 1, per_page: 20 }
    );

    function applyFilter(patch) {
        updateParams({ ...patch, page: 1 });
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, margin:0, letterSpacing:"-0.02em" }}>Leads</h1>
                    <span className="page-header-subtitle">{meta.total_count} total leads</span>
                </div>
                <div className="page-actions">
                    <Button variant="secondary" onClick={() => setShowImport(true)}>
                        <IconUpload width={14} height={14} /> Import
                    </Button>
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus width={14} height={14} /> New Lead
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="toolbar" style={{ marginBottom:16 }}>
                <div className="toolbar-filters">
                    <div style={{ position:"relative" }}>
                        <IconSearch width={14} height={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-400)" }} />
                        <input
                            className="field-input"
                            style={{ width:240, paddingLeft:32 }}
                            placeholder="Search leads…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); applyFilter({ search: e.target.value }); }}
                        />
                    </div>
                    <select className="field-select" style={{ width:150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["new","contacted","qualified","unqualified","lost"].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                        ))}
                    </select>
                    <select className="field-select" style={{ width:160 }} value={source} onChange={e => { setSource(e.target.value); applyFilter({ source: e.target.value }); }}>
                        <option value="">All sources</option>
                        {["website","referral","social_media","email_campaign","cold_call","event","whatsapp","paid_ad","partner","other"].map(s => (
                            <option key={s} value={s}>{s.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{width:28,height:28}} /></div>
            ) : leads.length === 0 ? (
                <div className="empty-state">
                    <h3>No leads found</h3>
                    <p>Try adjusting your filters or create a new lead.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop:8 }}><IconPlus width={14} height={14} /> New Lead</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Temp</th>
                                <th>Est. Value</th>
                                <th>Source</th>
                                <th>Owner</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                                    <td>
                                        <div style={{ fontWeight:600, color:"var(--ink-900)", fontSize:13.5 }}>{lead.name}</div>
                                        {lead.job_title && <div style={{ fontSize:11.5, color:"var(--ink-400)" }}>{lead.job_title}</div>}
                                    </td>
                                    <td className="cell-muted">{lead.company || "—"}</td>
                                    <td>
                                        {lead.email && <div style={{ fontSize:12.5, color:"var(--ink-600)" }}>{lead.email}</div>}
                                        {lead.phone && <div style={{ fontSize:12.5, color:"var(--ink-400)" }}>{lead.phone}</div>}
                                    </td>
                                    <td><StatusBadge status={lead.status} /></td>
                                    <td>
                                        {lead.qualification && (
                                            <span style={{ fontSize:13, fontWeight:600, color:TEMP_COLOR[lead.qualification] }}>
                                                {TEMP_EMOJI[lead.qualification]} {lead.qualification.charAt(0).toUpperCase()+lead.qualification.slice(1)}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight:600, color:"var(--success)", fontSize:13 }}>{formatCurrency(lead.estimated_value)}</td>
                                    <td className="cell-muted" style={{ fontSize:12.5 }}>
                                        {lead.source ? lead.source.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") : "—"}
                                    </td>
                                    <td className="cell-muted" style={{ fontSize:12.5 }}>{lead.assigned_to || "—"}</td>
                                    <td className="cell-muted" style={{ fontSize:12.5 }}>{formatDate(lead.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead" maxWidth={720}>
                <LeadFormModal
                    onCreated={() => { setShowCreate(false); reload(); toast.success("Lead created."); }}
                    onCancel={() => setShowCreate(false)}
                />
            </Modal>

            <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Leads" maxWidth={560}>
                <ImportLeadsModal
                    onClose={() => setShowImport(false)}
                    onImported={() => reload()}
                />
            </Modal>
        </div>
    );
}
