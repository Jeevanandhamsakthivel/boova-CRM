import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

const TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const RELATED_TYPE_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "customer", label: "Customer" },
  { value: "deal", label: "Deal" },
];

const EMPTY_FORM = {
  title: "",
  type: "call",
  description: "",
  due_date: "",
  status: "pending",
  related_to_type: "lead",
  related_to_id: "",
};

export function FollowUpFormModal({ open, onClose, onSaved, initialData, saveFn, defaultRelated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const base = initialData
        ? {
            ...EMPTY_FORM,
            ...initialData,
            due_date: toInputDate(initialData.due_date),
            related_to_type: initialData.related_to?.type || "lead",
            related_to_id: initialData.related_to?.id || "",
          }
        : { ...EMPTY_FORM, ...defaultRelated };
      setForm(base);
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData, defaultRelated]);

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
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assigned_to: initialData?.assigned_to || user.id,
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
      title={initialData ? "Edit follow-up" : "New follow-up"}
      maxWidth={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{initialData ? "Save changes" : "Schedule follow-up"}</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Title" required error={fieldErrors.title}>
          <TextInput required autoFocus value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Follow up on proposal" />
        </FieldGroup>
        <FieldRow>
          <FieldGroup label="Type" error={fieldErrors.type}>
            <Select options={TYPE_OPTIONS} value={form.type} onChange={(e) => update({ type: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Status" error={fieldErrors.status}>
            <Select options={STATUS_OPTIONS} value={form.status} onChange={(e) => update({ status: e.target.value })} />
          </FieldGroup>
        </FieldRow>
        <FieldGroup label="Due date" required error={fieldErrors.due_date}>
          <TextInput type="datetime-local" required value={form.due_date} onChange={(e) => update({ due_date: e.target.value })} />
        </FieldGroup>
        {!initialData && (
          <FieldRow>
            <FieldGroup label="Related to" error={fieldErrors.related_to_type}>
              <Select options={RELATED_TYPE_OPTIONS} value={form.related_to_type} onChange={(e) => update({ related_to_type: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Related record ID" hint="Paste the lead/customer/deal ID." error={fieldErrors.related_to_id}>
              <TextInput required value={form.related_to_id} onChange={(e) => update({ related_to_id: e.target.value })} placeholder="64f..." />
            </FieldGroup>
          </FieldRow>
        )}
        <FieldGroup label="Description" error={fieldErrors.description}>
          <TextArea value={form.description || ""} onChange={(e) => update({ description: e.target.value })} placeholder="Add any context…" />
        </FieldGroup>
      </form>
    </Modal>
  );
}

function toInputDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}