import { useEffect, useState } from "react";
import { dealsApi, pipelineApi } from "../../api/pipelineApi";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTS   = [{ value:"open",label:"Open" },{ value:"won",label:"Won" },{ value:"lost",label:"Lost" }];
const TYPE_OPTS     = [
    { value:"new_business",    label:"New Business"     },
    { value:"existing_business",label:"Existing Business"},
    { value:"renewal",         label:"Renewal"          },
    { value:"upsell",          label:"Upsell"           },
];
const CURRENCY_OPTS = ["USD","EUR","GBP","INR","AED","SGD"].map(c=>({ value:c, label:c }));

export function DealFormModal({ initialData = {}, onCreated, onCancel }) {
    const { user } = useAuth();
    const [stages, setStages] = useState([]);
    const [form, setForm] = useState({
        title:"", customer_id:"", stage_id:"", value:"", currency:"USD",
        status:"open", type:"new_business", assigned_to: user?.id||"",
        expected_close_date:"", probability:"", description:"", notes:"",
        source:"", competitor:"", next_step:"", tags:"",
        ...initialData,
    });
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        pipelineApi.listStages().then(res => {
            const s = res.data.data || [];
            setStages(s);
            if (s.length && !form.stage_id) setForm(p => ({ ...p, stage_id: s[0].id }));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    async function handleSubmit(e) {
        e.preventDefault(); setSaving(true); setError(null); setFieldErrors({});
        try {
            const payload = {
                ...form,
                value:       parseFloat(form.value) || 0,
                probability: form.probability ? parseInt(form.probability) : undefined,
                tags:        form.tags ? form.tags.split(",").map(t=>t.trim()).filter(Boolean) : [],
            };
            if (!payload.expected_close_date) delete payload.expected_close_date;
            if (!payload.probability)         delete payload.probability;
            const res = await dealsApi.create(payload);
            onCreated(res.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
            setFieldErrors(getFieldErrors(err));
        } finally { setSaving(false); }
    }

    const stageOpts = stages.map(s => ({ value: s.id, label: s.name }));

    return (
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Deal Info</p>
            <FieldGroup label="Deal Title" required error={fieldErrors.title}>
                <TextInput value={form.title} onChange={e=>set("title",e.target.value)} required />
            </FieldGroup>
            <FieldRow>
                <FieldGroup label="Pipeline Stage" required error={fieldErrors.stage_id}>
                    <Select options={stageOpts} value={form.stage_id} onChange={e=>set("stage_id",e.target.value)} placeholder="Select stage…" />
                </FieldGroup>
                <FieldGroup label="Deal Type" error={fieldErrors.type}>
                    <Select options={TYPE_OPTS} value={form.type} onChange={e=>set("type",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Value" error={fieldErrors.value}>
                    <TextInput type="number" min="0" step="0.01" value={form.value} onChange={e=>set("value",e.target.value)} placeholder="0.00" />
                </FieldGroup>
                <FieldGroup label="Currency" error={fieldErrors.currency}>
                    <Select options={CURRENCY_OPTS} value={form.currency} onChange={e=>set("currency",e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Status" error={fieldErrors.status}>
                    <Select options={STATUS_OPTS} value={form.status} onChange={e=>set("status",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Win Probability (%)" error={fieldErrors.probability}>
                    <TextInput type="number" min="0" max="100" value={form.probability} onChange={e=>set("probability",e.target.value)} placeholder="0–100" />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Expected Close Date" error={fieldErrors.expected_close_date}>
                    <TextInput type="datetime-local" value={form.expected_close_date} onChange={e=>set("expected_close_date",e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Assigned To" required error={fieldErrors.assigned_to}>
                    <TextInput value={form.assigned_to} onChange={e=>set("assigned_to",e.target.value)} required />
                </FieldGroup>
            </FieldRow>

            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-400)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"8px 0 10px" }}>Context</p>
            <FieldRow>
                <FieldGroup label="Lead Source" error={fieldErrors.source}>
                    <TextInput value={form.source} onChange={e=>set("source",e.target.value)} placeholder="Referral, Cold call…" />
                </FieldGroup>
                <FieldGroup label="Competitor" error={fieldErrors.competitor}>
                    <TextInput value={form.competitor} onChange={e=>set("competitor",e.target.value)} placeholder="Zoho, Salesforce…" />
                </FieldGroup>
            </FieldRow>
            <FieldGroup label="Next Step" error={fieldErrors.next_step}>
                <TextInput value={form.next_step} onChange={e=>set("next_step",e.target.value)} placeholder="Send proposal by Friday…" />
            </FieldGroup>
            <FieldGroup label="Tags (comma-separated)" error={fieldErrors.tags}>
                <TextInput value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="enterprise, q3, priority" />
            </FieldGroup>
            <FieldGroup label="Description" error={fieldErrors.description}>
                <TextArea value={form.description} onChange={e=>set("description",e.target.value)} rows={2} />
            </FieldGroup>
            <FieldGroup label="Internal Notes" error={fieldErrors.notes}>
                <TextArea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2} />
            </FieldGroup>

            {error && <p className="field-error" style={{marginBottom:8}}>{error}</p>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" loading={saving}>Create Deal</Button>
            </div>
        </form>
    );
}
