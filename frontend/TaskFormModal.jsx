import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  due_date: "",
};

export function TaskFormModal({ open, onClose, onSaved, initialData, saveFn }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { ...EMPTY_FORM, ...initialData, due_date: toInputDate(initialData.due_date) }
          : EMPTY_FORM
      );
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
      title={initialData ? "Edit task" : "New task"}
      maxWidth={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{initialData ? "Save changes" : "Create task"}</Button>
        </>
      }
    >
      {error && <div className="alert-banner alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Title" required error={fieldErrors.title}>
          <TextInput required autoFocus value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Call Jordan about renewal" />
        </FieldGroup>
        <FieldGroup label="Description" error={fieldErrors.description}>
          <TextArea value={form.description || ""} onChange={(e) => update({ description: e.target.value })} placeholder="Add any context…" />
        </FieldGroup>
        <FieldRow>
          <FieldGroup label="Priority" error={fieldErrors.priority}>
            <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={(e) => update({ priority: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Status" error={fieldErrors.status}>
            <Select options={STATUS_OPTIONS} value={form.status} onChange={(e) => update({ status: e.target.value })} />
          </FieldGroup>
        </FieldRow>
        <FieldGroup label="Due date" error={fieldErrors.due_date}>
          <TextInput type="datetime-local" value={form.due_date} onChange={(e) => update({ due_date: e.target.value })} />
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