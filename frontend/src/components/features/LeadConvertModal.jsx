import { useEffect, useState } from "react";
import { leadsApi } from "../../api/leadsApi";
import { pipelineApi } from "../../api/pipelineApi";
import { getErrorMessage } from "../../utils/errorUtils";
import { FieldGroup, TextInput, Select } from "../ui/FormFields";
import { Button } from "../ui/Button";

export function LeadConvertModal({ lead, onConverted, onCancel }) {
    const [stages, setStages]       = useState([]);
    const [createDeal, setCreateDeal] = useState(true);
    const [dealTitle, setDealTitle]   = useState(`Deal — ${lead.company || lead.name}`);
    const [dealValue, setDealValue]   = useState(lead.estimated_value || "");
    const [stageId, setStageId]       = useState("");
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState(null);

    useEffect(() => {
        pipelineApi.listStages().then(res => {
            const s = res.data.data || [];
            setStages(s);
            if (s.length) setStageId(s[0].id);
        });
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            const payload = {
                create_deal: createDeal,
                deal_title:  createDeal ? dealTitle : undefined,
                deal_value:  createDeal ? parseFloat(dealValue) || 0 : undefined,
                stage_id:    createDeal ? stageId : undefined,
            };
            const res = await leadsApi.convert(lead.id, payload);
            onConverted(res.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally { setSaving(false); }
    }

    const stageOpts = stages.map(s => ({ value: s.id, label: s.name }));

    return (
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ padding:"14px 16px", background:"var(--success-tint)", borderRadius:"var(--radius-sm)", border:"1px solid rgba(63,143,111,.2)" }}>
                <p style={{ margin:0, fontSize:13.5, color:"var(--success)", fontWeight:600 }}>
                    Converting <strong>{lead.name}</strong> to a Customer
                </p>
                <p style={{ margin:"4px 0 0", fontSize:12.5, color:"var(--ink-600)" }}>
                    A new customer record will be created with all lead data. The lead will be marked as converted.
                </p>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:13.5, fontWeight:500, color:"var(--ink-700)" }}>
                <input
                    type="checkbox"
                    checked={createDeal}
                    onChange={e => setCreateDeal(e.target.checked)}
                    style={{ width:16, height:16 }}
                />
                Also create a deal from this lead
            </label>

            {createDeal && (
                <>
                    <FieldGroup label="Deal Title" required>
                        <TextInput value={dealTitle} onChange={e=>setDealTitle(e.target.value)} required />
                    </FieldGroup>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <FieldGroup label="Deal Value ($)">
                            <TextInput type="number" min="0" step="0.01" value={dealValue} onChange={e=>setDealValue(e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Pipeline Stage" required>
                            <Select options={stageOpts} value={stageId} onChange={e=>setStageId(e.target.value)} placeholder="Select stage…" />
                        </FieldGroup>
                    </div>
                </>
            )}

            {error && <p className="field-error">{error}</p>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={saving}>Convert Lead</Button>
            </div>
        </form>
    );
}
