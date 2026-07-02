import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "churned", label: "Churned" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "active",
  lifetime_value: "",
  notes: "",
};

export function CustomerFormModal({ open, onClose, onSaved, initialData, saveFn }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData, lifetime_value: initialData.lifetime_value ?? "" } : EMPTY_FORM);
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData]);

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
        lifetime_value: form.lifetime_value === "" ? 0 : Number(form.lifetime_value),
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
      title={initialData ? "Edit customer" : "New customer"}
      maxWidth={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{initialData ? "Save changes" : "Create customer"}</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Full name" required error={fieldErrors.name}>
          <TextInput required value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Jordan Lee" />
        </FieldGroup>
        <FieldRow>
          <FieldGroup label="Email" required error={fieldErrors.email}>
            <TextInput type="email" required value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="jordan@acme.com" />
          </FieldGroup>
          <FieldGroup label="Phone" error={fieldErrors.phone}>
            <TextInput value={form.phone || ""} onChange={(e) => update({ phone: e.target.value })} placeholder="+1 555 0100" />
          </FieldGroup>
        </FieldRow>
        <FieldRow>
          <FieldGroup label="Company" error={fieldErrors.company}>
            <TextInput value={form.company || ""} onChange={(e) => update({ company: e.target.value })} placeholder="Acme Corp" />
          </FieldGroup>
          <FieldGroup label="Status" error={fieldErrors.status}>
            <Select options={STATUS_OPTIONS} value={form.status} onChange={(e) => update({ status: e.target.value })} />
          </FieldGroup>
        </FieldRow>
        <FieldGroup label="Lifetime value" error={fieldErrors.lifetime_value}>
          <TextInput type="number" min="0" step="0.01" value={form.lifetime_value} onChange={(e) => update({ lifetime_value: e.target.value })} placeholder="0.00" />
        </FieldGroup>
        <FieldGroup label="Notes" error={fieldErrors.notes}>
          <TextArea value={form.notes || ""} onChange={(e) => update({ notes: e.target.value })} placeholder="Anything the team should know…" />
        </FieldGroup>
      </form>
    </Modal>
  );
}