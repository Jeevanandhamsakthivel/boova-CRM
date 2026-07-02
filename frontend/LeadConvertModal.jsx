import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput } from "../ui/FormFields";
import { leadsApi } from "../../api/leadsApi";
import { getErrorMessage } from "../../utils/errorUtils";

export function LeadConvertModal({ open, onClose, lead, onConverted }) {
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        create_deal: createDeal,
        deal_title: dealTitle || undefined,
        deal_value: dealValue ? Number(dealValue) : undefined,
      };
      const res = await leadsApi.convert(lead.id, payload);
      onConverted(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!lead) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert lead to customer"
      maxWidth={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Convert</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <p style={{ fontSize: 13.5, color: "var(--ink-600)", marginBottom: 16 }}>
        <strong>{lead.name}</strong> will become a customer record. You can optionally start a deal
        in the sales pipeline at the same time.
      </p>
      <form onSubmit={handleSubmit}>
        <FieldGroup label="">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <input type="checkbox" checked={createDeal} onChange={(e) => setCreateDeal(e.target.checked)} />
            Also create a deal in the pipeline
          </label>
        </FieldGroup>
        {createDeal && (
          <>
            <FieldGroup label="Deal title" hint={`Defaults to "Deal for ${lead.name}"`}>
              <TextInput value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} placeholder={`Deal for ${lead.name}`} />
            </FieldGroup>
            <FieldGroup label="Deal value" hint="Defaults to the lead's estimated value.">
              <TextInput type="number" min="0" step="0.01" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder={lead.estimated_value || "0.00"} />
            </FieldGroup>
          </>
        )}
      </form>
    </Modal>
  );
}