import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "cold_call", label: "Cold Call" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
  { value: "lost", label: "Lost" },
];

const QUALIFICATION_OPTIONS = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  source: "website",
  status: "new",
  qualification: "",
  estimated_value: "",
  notes: "",
};

export function LeadFormModal({ open, onClose, onSaved, initialData, saveFn }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData, estimated_value: initialData.estimated_value ?? "" } : EMPTY_FORM);
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
        estimated_value: form.estimated_value === "" ? 0 : Number(form.estimated_value),
        qualification: form.qualification || null,
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
      title={initialData ? "Edit lead" : "New lead"}
      maxWidth={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{initialData ? "Save changes" : "Create lead"}</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Full name" required error={fieldErrors.name}>
          <TextInput required value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Jordan Lee" />
        </FieldGroup>
        <FieldRow>
          <FieldGroup label="Email" error={fieldErrors.email}>
            <TextInput type="email" value={form.email || ""} onChange={(e) => update({ email: e.target.value })} placeholder="jordan@acme.com" />
          </FieldGroup>
          <FieldGroup label="Phone" error={fieldErrors.phone}>
            <TextInput value={form.phone || ""} onChange={(e) => update({ phone: e.target.value })} placeholder="+1 555 0100" />
          </FieldGroup>
        </FieldRow>
        <FieldRow>
          <FieldGroup label="Company" error={fieldErrors.company}>
            <TextInput value={form.company || ""} onChange={(e) => update({ company: e.target.value })} placeholder="Acme Corp" />
          </FieldGroup>
          <FieldGroup label="Job title" error={fieldErrors.job_title}>
            <TextInput value={form.job_title || ""} onChange={(e) => update({ job_title: e.target.value })} placeholder="VP Sales" />
          </FieldGroup>
        </FieldRow>
        <FieldRow>
          <FieldGroup label="Source" error={fieldErrors.source}>
            <Select options={SOURCE_OPTIONS} value={form.source} onChange={(e) => update({ source: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Status" error={fieldErrors.status}>
            <Select options={STATUS_OPTIONS} value={form.status} onChange={(e) => update({ status: e.target.value })} />
          </FieldGroup>
        </FieldRow>
        <FieldRow>
          <FieldGroup label="Qualification" error={fieldErrors.qualification}>
            <Select options={QUALIFICATION_OPTIONS} placeholder="Not set" value={form.qualification || ""} onChange={(e) => update({ qualification: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Estimated value" error={fieldErrors.estimated_value}>
            <TextInput type="number" min="0" step="0.01" value={form.estimated_value} onChange={(e) => update({ estimated_value: e.target.value })} placeholder="0.00" />
          </FieldGroup>
        </FieldRow>
        <FieldGroup label="Notes" error={fieldErrors.notes}>
          <TextArea value={form.notes || ""} onChange={(e) => update({ notes: e.target.value })} placeholder="Anything the team should know…" />
        </FieldGroup>
      </form>
    </Modal>
  );
}