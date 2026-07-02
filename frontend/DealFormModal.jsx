import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput, Select, FieldRow } from "../ui/FormFields";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

export function DealFormModal({ open, onClose, onSaved, saveFn, stages, defaultStageId }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", customer_id: "", stage_id: "", value: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ title: "", customer_id: "", stage_id: defaultStageId || stages[0]?.id || "", value: "" });
      setError("");
      setFieldErrors({});
    }
  }, [open, defaultStageId, stages]);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        value: form.value === "" ? 0 : Number(form.value),
        assigned_to: user.id,
      };
      await saveFn(payload);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New deal"
      maxWidth={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create deal</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Deal title" required error={fieldErrors.title}>
          <TextInput required autoFocus value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Acme Corp — Annual Plan" />
        </FieldGroup>
        <FieldGroup label="Customer ID" required hint="Paste the customer's ID from their detail page." error={fieldErrors.customer_id}>
          <TextInput required value={form.customer_id} onChange={(e) => update({ customer_id: e.target.value })} placeholder="64f..." />
        </FieldGroup>
        <FieldRow>
          <FieldGroup label="Stage" error={fieldErrors.stage_id}>
            <Select
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              value={form.stage_id}
              onChange={(e) => update({ stage_id: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Value" error={fieldErrors.value}>
            <TextInput type="number" min="0" step="0.01" value={form.value} onChange={(e) => update({ value: e.target.value })} placeholder="0.00" />
          </FieldGroup>
        </FieldRow>
      </form>
    </Modal>
  );
}