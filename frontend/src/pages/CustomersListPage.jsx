import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../api/customersApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../components/ui/FormFields";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { getErrorMessage, getFieldErrors } from "../utils/errorUtils";
import { IconPlus, IconSearch } from "../components/ui/Icons";

const STATUS_OPTS = ["active","inactive","churned","prospect"].map(s=>({ value:s, label:s.charAt(0).toUpperCase()+s.slice(1) }));
const IND_OPTS    = ["technology","finance","healthcare","retail","manufacturing","real_estate","education","consulting","media","logistics","other"].map(s=>({ value:s, label:s.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") }));

function CreateCustomerForm({ onCreated, onCancel }) {
    const { user } = useAuth();
    const [form, setForm] = useState({ name:"", email:"", phone:"", company:"", job_title:"", industry:"", status:"active", assigned_to: user?.id||"", notes:"", tags:"" });
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const set = (k,v) => setForm(p=>({...p,[k]:v}));

    async function handleSubmit(e) {
        e.preventDefault(); setSaving(true); setError(null); setFieldErrors({});
        try {
            const payload = { ...form };
            if (payload.tags) payload.tags = payload.tags.split(",").map(t=>t.trim()).filter(Boolean);
            const res = await customersApi.create(payload);
            onCreated(res.data.data);
        } catch (err) { setError(getErrorMessage(err)); setFieldErrors(getFieldErrors(err)); }
        finally { setSaving(false); }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <FieldRow>
                <FieldGroup label="Full Name" required error={fieldErrors.name}><TextInput value={form.name} onChange={e=>set("name",e.target.value)} required /></FieldGroup>
                <FieldGroup label="Email" required error={fieldErrors.email}><TextInput type="email" value={form.email} onChange={e=>set("email",e.target.value)} required /></FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Phone" error={fieldErrors.phone}><TextInput value={form.phone} onChange={e=>set("phone",e.target.value)} /></FieldGroup>
                <FieldGroup label="Company" error={fieldErrors.company}><TextInput value={form.company} onChange={e=>set("company",e.target.value)} /></FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Job Title" error={fieldErrors.job_title}><TextInput value={form.job_title} onChange={e=>set("job_title",e.target.value)} /></FieldGroup>
                <FieldGroup label="Industry" error={fieldErrors.industry}><Select options={IND_OPTS} value={form.industry} onChange={e=>set("industry",e.target.value)} placeholder="— select —" /></FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Status" error={fieldErrors.status}><Select options={STATUS_OPTS} value={form.status} onChange={e=>set("status",e.target.value)} /></FieldGroup>
                <FieldGroup label="Assigned To" error={fieldErrors.assigned_to}><TextInput value={form.assigned_to} onChange={e=>set("assigned_to",e.target.value)} /></FieldGroup>
            </FieldRow>
            <FieldGroup label="Tags (comma-separated)" error={fieldErrors.tags}><TextInput value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="vip, enterprise" /></FieldGroup>
            <FieldGroup label="Notes" error={fieldErrors.notes}><TextArea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2} /></FieldGroup>
            {error && <p className="field-error" style={{marginBottom:8}}>{error}</p>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" loading={saving}>Create Customer</Button>
            </div>
        </form>
    );
}

export default function CustomersListPage() {
    const navigate      = useNavigate();
    const toast         = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch]         = useState("");
    const [status, setStatus]         = useState("");

    const { items: customers, meta, loading, reload, updateParams } = usePaginatedList(
        customersApi.list,
        { search, status, page:1, per_page:20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page:1 }); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, margin:0, letterSpacing:"-0.02em" }}>Customers</h1>
                    <span className="page-header-subtitle">{meta.total_count} total customers</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus width={14} height={14} /> New Customer
                    </Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom:16 }}>
                <div className="toolbar-filters">
                    <div style={{ position:"relative" }}>
                        <IconSearch width={14} height={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-400)" }} />
                        <input className="field-input" style={{ width:260, paddingLeft:32 }} placeholder="Search customers…" value={search}
                            onChange={e=>{ setSearch(e.target.value); applyFilter({ search:e.target.value }); }} />
                    </div>
                    <select className="field-select" style={{ width:150 }} value={status} onChange={e=>{ setStatus(e.target.value); applyFilter({ status:e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["active","inactive","churned","prospect"].map(s=>(
                            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{width:28,height:28}} /></div>
            ) : customers.length === 0 ? (
                <div className="empty-state">
                    <h3>No customers yet</h3>
                    <p>Create one directly or convert a qualified lead.</p>
                    <Button onClick={()=>setShowCreate(true)} style={{marginTop:8}}><IconPlus width={14} height={14}/> New Customer</Button>
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
                                <th>Industry</th>
                                <th>Lifetime Value</th>
                                <th>Owner</th>
                                <th>Tags</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c=>(
                                <tr key={c.id} onClick={()=>navigate(`/customers/${c.id}`)}>
                                    <td>
                                        <div style={{ fontWeight:600, color:"var(--ink-900)", fontSize:13.5 }}>{c.name}</div>
                                        {c.job_title && <div style={{ fontSize:11.5, color:"var(--ink-400)" }}>{c.job_title}</div>}
                                    </td>
                                    <td className="cell-muted">{c.company||"—"}</td>
                                    <td>
                                        {c.email && <div style={{ fontSize:12.5, color:"var(--ink-600)" }}>{c.email}</div>}
                                        {c.phone && <div style={{ fontSize:12.5, color:"var(--ink-400)" }}>{c.phone}</div>}
                                    </td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td className="cell-muted" style={{fontSize:12.5}}>
                                        {c.industry ? c.industry.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") : "—"}
                                    </td>
                                    <td style={{ fontWeight:600, color:"var(--success)", fontSize:13 }}>{formatCurrency(c.lifetime_value)}</td>
                                    <td className="cell-muted" style={{fontSize:12.5}}>{c.assigned_to||"—"}</td>
                                    <td>
                                        <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                                            {(c.tags||[]).slice(0,3).map(t=>(
                                                <span key={t} className="badge badge-neutral" style={{fontSize:10.5}}>{t}</span>
                                            ))}
                                            {c.tags?.length > 3 && <span style={{fontSize:11,color:"var(--ink-400)"}}>+{c.tags.length-3}</span>}
                                        </div>
                                    </td>
                                    <td className="cell-muted" style={{fontSize:12.5}}>{formatDate(c.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p=>updateParams({ page:p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New Customer" maxWidth={680}>
                <CreateCustomerForm
                    onCreated={() => { setShowCreate(false); reload(); toast.success("Customer created."); }}
                    onCancel={() => setShowCreate(false)}
                />
            </Modal>
        </div>
    );
}
