import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadsApi } from "../api/leadsApi";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { LeadConvertModal } from "../components/features/LeadConvertModal";
import { useToast } from "../context/ToastContext";
import { formatDate, formatCurrency } from "../utils/formatters";
import { getErrorMessage } from "../utils/errorUtils";
import {
    IconMail, IconPhone, IconBuilding, IconEdit, IconTrash,
    IconArrowRight, IconCheck,
} from "../components/ui/Icons";

const STATUS_OPTS = ["new","contacted","qualified","unqualified","lost"];
const SOURCE_OPTS = ["website","referral","social_media","email_campaign","cold_call","event","whatsapp","paid_ad","partner","other"];
const QUAL_OPTS   = ["hot","warm","cold"];
const IND_OPTS    = ["technology","finance","healthcare","retail","manufacturing","real_estate","education","consulting","media","logistics","other"];

function titleCase(s) { return (s||"").split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" "); }

function InfoRow({ label, value }) {
    return (
        <div style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border-hairline)" }}>
            <span style={{ minWidth:140, fontSize:12.5, fontWeight:600, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.04em", flexShrink:0 }}>{label}</span>
            <span style={{ fontSize:13.5, color:"var(--ink-800)" }}>{value || <span style={{ color:"var(--ink-200)" }}>—</span>}</span>
        </div>
    );
}

function EditField({ label, fieldKey, form, setForm, type="text", options }) {
    return (
        <div className="field-group">
            <label className="field-label">{label}</label>
            {options ? (
                <select className="field-select" value={form[fieldKey]||""} onChange={e=>setForm(f=>({...f,[fieldKey]:e.target.value}))}>
                    <option value="">—</option>
                    {options.map(o=><option key={o} value={o}>{titleCase(o)}</option>)}
                </select>
            ) : type === "textarea" ? (
                <textarea className="field-textarea" value={form[fieldKey]||""} onChange={e=>setForm(f=>({...f,[fieldKey]:e.target.value}))} rows={3} />
            ) : (
                <input className="field-input" type={type} value={form[fieldKey]||""} onChange={e=>setForm(f=>({...f,[fieldKey]:e.target.value}))} />
            )}
        </div>
    );
}

const TEMP_COLOR = { hot:"var(--danger)", warm:"var(--warning)", cold:"var(--info)" };
const TEMP_EMOJI = { hot:"🔥", warm:"🌤", cold:"❄️" };

export default function LeadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast    = useToast();

    const [lead,    setLead]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form,    setForm]    = useState({});
    const [saving,  setSaving]  = useState(false);
    const [showConvert, setShowConvert] = useState(false);

    useEffect(() => {
        leadsApi.get(id)
            .then(r => { const d = r.data.data; setLead(d); setForm(d); })
            .catch(() => navigate("/leads"))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    async function handleSave() {
        setSaving(true);
        try {
            const r = await leadsApi.update(id, form);
            setLead(r.data.data); setForm(r.data.data); setEditing(false);
            toast.success("Lead updated.");
        } catch (err) { toast.error(getErrorMessage(err)); }
        finally { setSaving(false); }
    }

    async function handleDelete() {
        if (!window.confirm("Permanently delete this lead?")) return;
        await leadsApi.remove(id);
        toast.success("Lead deleted.");
        navigate("/leads");
    }

    if (loading) return <div className="page-loading"><div className="spinner" style={{width:32,height:32}} /></div>;
    if (!lead)   return null;

    const canConvert = ["qualified","contacted","new"].includes(lead.status) && lead.status !== "converted";

    return (
        <div style={{ maxWidth:900 }}>
            {/* ── Header ── */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border-hairline)", borderRadius:"var(--radius-lg)", marginBottom:20, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"24px 28px", display:"flex", gap:18, alignItems:"flex-start" }}>
                    {/* Avatar */}
                    <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#e8f0fe,#c7d7f9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontFamily:"var(--font-display)", fontWeight:700, color:"#3E6FA8", flexShrink:0 }}>
                        {(lead.name||"?").slice(0,2).toUpperCase()}
                    </div>
                    {/* Main info */}
                    <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                            <h1 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>{lead.name}</h1>
                            <StatusBadge status={lead.status} />
                            {lead.qualification && (
                                <span style={{ fontSize:13, fontWeight:600, color:TEMP_COLOR[lead.qualification] }}>
                                    {TEMP_EMOJI[lead.qualification]} {titleCase(lead.qualification)}
                                </span>
                            )}
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:0, rowGap:4 }}>
                            {[
                                lead.company && { icon:<IconBuilding width={13} height={13}/>, val:lead.company },
                                lead.job_title && { icon:null, val:lead.job_title },
                                lead.email && { icon:<IconMail width={13} height={13}/>, val:lead.email },
                                lead.phone && { icon:<IconPhone width={13} height={13}/>, val:lead.phone },
                            ].filter(Boolean).map((item,i) => (
                                <span key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:13, color:"var(--ink-600)", paddingRight:14, borderRight:"1px solid var(--border-hairline)", marginRight:14 }}>
                                    {item.icon}{item.val}
                                </span>
                            ))}
                        </div>
                        {lead.tags?.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
                                {lead.tags.map(t=><span key={t} className="badge badge-neutral">{t}</span>)}
                            </div>
                        )}
                    </div>
                    {/* KPI strip */}
                    <div style={{ display:"flex", flexDirection:"column", gap:2, textAlign:"right", flexShrink:0 }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:700, color:"var(--success)" }}>{formatCurrency(lead.estimated_value)}</span>
                        <span style={{ fontSize:11, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Est. Value</span>
                        <span style={{ fontSize:12.5, color:"var(--ink-400)", marginTop:4 }}>Source: {titleCase(lead.source)}</span>
                        <span style={{ fontSize:12.5, color:"var(--ink-400)" }}>Created: {formatDate(lead.created_at)}</span>
                    </div>
                </div>

                {/* Action bar */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 28px", borderTop:"1px solid var(--border-hairline)", background:"var(--surface-sunken)" }}>
                    {editing ? (
                        <>
                            <Button variant="secondary" size="sm" onClick={()=>{setEditing(false);setForm(lead);}}>Cancel</Button>
                            <Button size="sm" loading={saving} onClick={handleSave}><IconCheck width={13} height={13}/> Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="secondary" size="sm" onClick={()=>setEditing(true)}><IconEdit width={13} height={13}/> Edit</Button>
                            {canConvert && (
                                <Button size="sm" onClick={()=>setShowConvert(true)}>
                                    <IconArrowRight width={13} height={13}/> Convert to Customer
                                </Button>
                            )}
                            {lead.status === "converted" && (
                                <span className="badge badge-success">✓ Converted to Customer</span>
                            )}
                            <div style={{ marginLeft:"auto" }}>
                                <Button variant="secondary" size="sm" onClick={handleDelete} style={{ color:"var(--danger)", borderColor:"var(--danger-tint)" }}>
                                    <IconTrash width={13} height={13}/> Delete
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            {editing ? (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border-hairline)", borderRadius:"var(--radius-lg)", padding:"24px 28px", boxShadow:"var(--shadow-sm)" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        <EditField label="Full Name" fieldKey="name" form={form} setForm={setForm} />
                        <EditField label="Email" fieldKey="email" form={form} setForm={setForm} type="email" />
                        <EditField label="Phone" fieldKey="phone" form={form} setForm={setForm} />
                        <EditField label="Mobile" fieldKey="mobile" form={form} setForm={setForm} />
                        <EditField label="WhatsApp" fieldKey="whatsapp" form={form} setForm={setForm} />
                        <EditField label="Company" fieldKey="company" form={form} setForm={setForm} />
                        <EditField label="Job Title" fieldKey="job_title" form={form} setForm={setForm} />
                        <EditField label="Department" fieldKey="department" form={form} setForm={setForm} />
                        <EditField label="Industry" fieldKey="industry" form={form} setForm={setForm} options={IND_OPTS} />
                        <EditField label="Source" fieldKey="source" form={form} setForm={setForm} options={SOURCE_OPTS} />
                        <EditField label="Status" fieldKey="status" form={form} setForm={setForm} options={STATUS_OPTS} />
                        <EditField label="Temperature" fieldKey="qualification" form={form} setForm={setForm} options={QUAL_OPTS} />
                        <EditField label="Estimated Value ($)" fieldKey="estimated_value" form={form} setForm={setForm} type="number" />
                        <EditField label="City" fieldKey="city" form={form} setForm={setForm} />
                        <EditField label="Country" fieldKey="country" form={form} setForm={setForm} />
                        <EditField label="Campaign" fieldKey="campaign" form={form} setForm={setForm} />
                        <EditField label="Website" fieldKey="website" form={form} setForm={setForm} />
                        <EditField label="LinkedIn URL" fieldKey="linkedin_url" form={form} setForm={setForm} />
                    </div>
                    <div style={{ gridColumn:"1/-1", marginTop:4 }}>
                        <EditField label="Notes" fieldKey="notes" form={form} setForm={setForm} type="textarea" />
                    </div>
                </div>
            ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    {/* Contact details */}
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border-hairline)", borderRadius:"var(--radius-lg)", padding:"20px 24px", boxShadow:"var(--shadow-sm)" }}>
                        <h3 style={{ fontSize:13, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Contact Details</h3>
                        <InfoRow label="Email"      value={lead.email} />
                        <InfoRow label="Phone"      value={lead.phone} />
                        <InfoRow label="Mobile"     value={lead.mobile} />
                        <InfoRow label="WhatsApp"   value={lead.whatsapp} />
                        <InfoRow label="City"       value={lead.city} />
                        <InfoRow label="Country"    value={lead.country} />
                        <InfoRow label="LinkedIn"   value={lead.linkedin_url ? <a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={{color:"var(--accent-strong)"}}>View Profile</a> : null} />
                        <InfoRow label="Website"    value={lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" style={{color:"var(--accent-strong)"}}>{lead.website}</a> : null} />
                    </div>

                    {/* Lead details */}
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border-hairline)", borderRadius:"var(--radius-lg)", padding:"20px 24px", boxShadow:"var(--shadow-sm)" }}>
                        <h3 style={{ fontSize:13, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Lead Details</h3>
                        <InfoRow label="Company"    value={lead.company} />
                        <InfoRow label="Job Title"  value={lead.job_title} />
                        <InfoRow label="Department" value={lead.department} />
                        <InfoRow label="Industry"   value={titleCase(lead.industry)} />
                        <InfoRow label="Source"     value={titleCase(lead.source)} />
                        <InfoRow label="Campaign"   value={lead.campaign} />
                        <InfoRow label="Owner"      value={lead.assigned_to} />
                        <InfoRow label="Created"    value={formatDate(lead.created_at)} />
                        <InfoRow label="Updated"    value={formatDate(lead.updated_at)} />
                    </div>

                    {/* Notes — full width */}
                    {lead.notes && (
                        <div style={{ gridColumn:"1/-1", background:"var(--surface)", border:"1px solid var(--border-hairline)", borderRadius:"var(--radius-lg)", padding:"20px 24px", boxShadow:"var(--shadow-sm)" }}>
                            <h3 style={{ fontSize:13, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 12px" }}>Notes</h3>
                            <p style={{ fontSize:13.5, color:"var(--ink-800)", lineHeight:1.65, whiteSpace:"pre-wrap", margin:0 }}>{lead.notes}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Convert modal */}
            <Modal open={showConvert} onClose={()=>setShowConvert(false)} title="Convert Lead to Customer">
                <LeadConvertModal
                    lead={lead}
                    onConverted={(data) => {
                        setShowConvert(false);
                        toast.success("Lead converted to customer.");
                        navigate(`/customers/${data.customer?.id || data.id}`);
                    }}
                    onCancel={()=>setShowConvert(false)}
                />
            </Modal>
        </div>
    );
}
