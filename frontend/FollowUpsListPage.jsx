import { useEffect, useState } from "react";
import { followupsApi } from "../../api/followupsApi";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { FilterSelect } from "../../components/common/FilterBar";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { IconPlus, IconEdit, IconTrash } from "../../components/ui/Icons";
import { FollowUpFormModal } from "../../components/followups/FollowUpFormModal";
import { formatDateTime, titleCase } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/errorUtils";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "overdue", label: "Overdue" },
];

const TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

export default function FollowUpsListPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, meta, loading, error, setParams, goToPage, reload } = usePaginatedList(followupsApi.list, {
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    setParams({ page: 1, status: statusFilter || undefined, type: typeFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  async function handleCreate(payload) {
    await followupsApi.create(payload);
  }

  async function handleUpdate(payload) {
    await followupsApi.update(editingFollowUp.id, payload);
  }

  function handleSaved() {
    toast.success(editingFollowUp ? "Follow-up updated." : "Follow-up scheduled.");
    setModalOpen(false);
    setEditingFollowUp(null);
    reload();
  }

  async function markCompleted(followUp) {
    try {
      await followupsApi.update(followUp.id, { status: "completed" });
      toast.success("Marked as completed.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await followupsApi.remove(deleteTarget.id);
      toast.success("Follow-up deleted.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const columns = [
    { key: "title", header: "Follow-up", render: (row) => <span className="cell-strong">{row.title}</span> },
    { key: "type", header: "Type", render: (row) => titleCase(row.type) },
    { key: "related_to", header: "Related to", render: (row) => titleCase(row.related_to?.type) },
    { key: "due_date", header: "Due", render: (row) => formatDateTime(row.due_date) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      width: 120,
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status === "pending" && (
            <Button variant="ghost" size="sm" onClick={() => markCompleted(row)}>
              Done
            </Button>
          )}
          <Button variant="ghost" size="sm" icon onClick={() => { setEditingFollowUp(row); setModalOpen(true); }}>
            <IconEdit width={14} height={14} />
          </Button>
          <Button variant="ghost" size="sm" icon onClick={() => setDeleteTarget(row)}>
            <IconTrash width={14} height={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Follow-ups"
        subtitle="Scheduled calls, emails, and meetings across leads and customers."
        actions={
          <Button onClick={() => { setEditingFollowUp(null); setModalOpen(true); }}>
            <IconPlus width={15} height={15} /> New follow-up
          </Button>
        }
      />

      <div className="toolbar">
        <div className="toolbar-filters">
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All statuses" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="All types" />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={goToPage}
        emptyMessage="No follow-ups scheduled."
      />

      <FollowUpFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingFollowUp(null); }}
        initialData={editingFollowUp}
        saveFn={editingFollowUp ? handleUpdate : handleCreate}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this follow-up?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ""}
        confirmLabel="Delete follow-up"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}