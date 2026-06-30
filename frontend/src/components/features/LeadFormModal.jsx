import { useState } from "react";
import { leadsApi } from "../../api/leadsApi";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTS = ["new","contacted","qualified","unqualified","lost"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }));
const SOURCE_OPTS = ["website","referral","social_media","email_campaign","cold_call","event","whatsapp","paid_ad","partner","other"].map(s => ({ value: s, label: s.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") }));
const QUAL_OPTS   = [{ value:"hot",label:"🔥 Hot" },{ value:"warm",label:"🌤 Warm" },{ value:"cold",label:"❄️ Cold" }];
const IND_OPTS    = ["technology","finance","healthcare","retail","manufacturing","real_estate","education","consulting","media","logistics","other"].map(s => ({ value:s, label:s.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") }));

export function LeadFormModal({ onCreated, onCancel, initial = {} }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: "", email: "", phone: "", mobile: "", whatsapp: "",
        company: "", job_title: "", department: "", industry: "",
        website: "", linkedin_url: "", source: "website", status: "new",
        qualification: "", estimated_value: "", assigned_to: user?.id || "",
        city: "", country: "", campaign: "", notes: "", tags: "",
        ...initial,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true); setError(null); setFieldErrors({});
        try {
            const payload = { ...form };
            if (payload.estimated_value) payload.estimated_value = parseFloat(payload.estimated_value) || 0;
            if (payload.tags) payload.tags = payload.tags.split(",").map(t=>t.trim()).filter(Boolean);
            const res = await leadsApi.create(payload);
            onCreated(res.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
            setFieldErrors(getFieldErrors(err));
        } finally { setSaving(false); }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Basic Info</p>
            <FieldRow>
                <FieldGroup label="Full Name" required error={fieldErrors.name}>
                    <TextInput value={form.name} onChange={e=>set("name",e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="Email" error={fieldErrors.email}>
                    <TextInput type="email" value={form.email} onChange={e=>set("email",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Phone" error={fieldErrors.phone}>
                    <TextInput value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 555 000 0000" />
                </FieldGroup>
                <FieldGroup label="Mobile" error={fieldErrors.mobile}>
                    <TextInput value={form.mobile} onChange={e=>set("mobile",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="WhatsApp" error={fieldErrors.whatsapp}>
                    <TextInput value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} placeholder="+1 555 000 0000" />
                </FieldGroup>
                <FieldGroup label="Company" error={fieldErrors.company}>
                    <TextInput value={form.company} onChange={e=>set("company",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Job Title" error={fieldErrors.job_title}>
                    <TextInput value={form.job_title} onChange={e=>set("job_title",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Department" error={fieldErrors.department}>
                    <TextInput value={form.department} onChange={e=>set("department",e.target.value)} />
                </FieldGroup>
            </FieldRow>

            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"8px 0 10px" }}>Qualification</p>
            <FieldRow>
                <FieldGroup label="Status" error={fieldErrors.status}>
                    <Select options={STATUS_OPTS} value={form.status} onChange={e=>set("status",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Temperature" error={fieldErrors.qualification}>
                    <Select options={QUAL_OPTS} value={form.qualification} onChange={e=>set("qualification",e.target.value)} placeholder="— select —" />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Source" error={fieldErrors.source}>
                    <Select options={SOURCE_OPTS} value={form.source} onChange={e=>set("source",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Estimated Value ($)" error={fieldErrors.estimated_value}>
                    <TextInput type="number" min="0" step="0.01" value={form.estimated_value} onChange={e=>set("estimated_value",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Industry" error={fieldErrors.industry}>
                    <Select options={IND_OPTS} value={form.industry} onChange={e=>set("industry",e.target.value)} placeholder="— select —" />
                </FieldGroup>
                <FieldGroup label="Campaign" error={fieldErrors.campaign}>
                    <TextInput value={form.campaign} onChange={e=>set("campaign",e.target.value)} placeholder="Summer 2025, Google Ads…" />
                </FieldGroup>
            </FieldRow>

            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"8px 0 10px" }}>Location & Links</p>
            <FieldRow>
                <FieldGroup label="City" error={fieldErrors.city}>
                    <TextInput value={form.city} onChange={e=>set("city",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Country" error={fieldErrors.country}>
                    <TextInput value={form.country} onChange={e=>set("country",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Website" error={fieldErrors.website}>
                    <TextInput value={form.website} onChange={e=>set("website",e.target.value)} placeholder="https://…" />
                </FieldGroup>
                <FieldGroup label="LinkedIn URL" error={fieldErrors.linkedin_url}>
                    <TextInput value={form.linkedin_url} onChange={e=>set("linkedin_url",e.target.value)} placeholder="https://linkedin.com/in/…" />
                </FieldGroup>
            </FieldRow>

            <FieldGroup label="Tags (comma-separated)" error={fieldErrors.tags}>
                <TextInput value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="enterprise, saas, priority" />
            </FieldGroup>
            <FieldGroup label="Notes" error={fieldErrors.notes}>
                <TextArea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} />
            </FieldGroup>

            {error && <p className="field-error" style={{ marginBottom:8 }}>{error}</p>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingTop:4 }}>
                {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" loading={saving}>Create Lead</Button>
            </div>
        </form>
    );
}
