import { useEffect, useState } from "react";
import { tasksApi } from "../../api/tasksApi";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterSelect } from "../../components/common/FilterBar";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState, PageLoading, Pagination } from "../../components/ui/Misc";
import { IconPlus, IconCheck, IconEdit, IconTrash, IconTasks } from "../../components/ui/Icons";
import { TaskFormModal } from "../../components/tasks/TaskFormModal";
import { formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/errorUtils";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TasksListPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, meta, loading, error, setParams, goToPage, reload } = usePaginatedList(tasksApi.list, {
    page: 1,
    per_page: 20,
    sort_by: "due_date",
    sort_order: "asc",
  });

  useEffect(() => {
    setParams({ page: 1, status: statusFilter || undefined, priority: priorityFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  async function handleCreate(payload) {
    await tasksApi.create(payload);
  }

  async function handleUpdate(payload) {
    await tasksApi.update(editingTask.id, payload);
  }

  function handleSaved() {
    toast.success(editingTask ? "Task updated." : "Task created.");
    setModalOpen(false);
    setEditingTask(null);
    reload();
  }

  function openEdit(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }

  async function toggleComplete(task) {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    try {
      await tasksApi.update(task.id, { status: newStatus });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await tasksApi.remove(deleteTarget.id);
      toast.success("Task deleted.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Tasks"
        subtitle="What needs to happen, and by when."
        actions={
          <Button onClick={openCreate}>
            <IconPlus width={15} height={15} /> New task
          </Button>
        }
      />

      <div className="toolbar">
        <div className="toolbar-filters">
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All statuses" />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_OPTIONS} placeholder="All priorities" />
        </div>
      </div>

      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="card card-pad">
          <EmptyState icon={<IconTasks width={32} height={32} />} title="Couldn't load tasks" message={error} />
        </div>
      ) : items.length === 0 ? (
        <div className="card card-pad">
          <EmptyState icon={<IconTasks width={32} height={32} />} title="No tasks yet" message="Create a task to keep your follow-through on track." />
        </div>
      ) : (
        <div className="data-table-wrap">
          <div className="flex-col">
            {items.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3"
                style={{ padding: "13px 16px", borderBottom: "1px solid var(--border-hairline)" }}
              >
                <button
                  onClick={() => toggleComplete(task)}
                  aria-label="Toggle complete"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `1.5px solid ${task.status === "completed" ? "var(--success)" : "var(--ink-200)"}`,
                    background: task.status === "completed" ? "var(--success)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flex: "none",
                  }}
                >
                  {task.status === "completed" && <IconCheck width={12} height={12} style={{ color: "#fff" }} />}
                </button>

                <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: task.status === "completed" ? "var(--ink-400)" : "var(--ink-900)",
                      textDecoration: task.status === "completed" ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </span>
                  {task.description && (
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {task.description}
                    </span>
                  )}
                </div>

                <StatusBadge status={task.priority} />
                <span className="text-muted text-sm" style={{ minWidth: 90, textAlign: "right" }}>
                  {task.due_date ? formatDate(task.due_date) : "No due date"}
                </span>

                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" icon onClick={() => openEdit(task)} aria-label="Edit task">
                    <IconEdit width={14} height={14} />
                  </Button>
                  <Button variant="ghost" size="sm" icon onClick={() => setDeleteTarget(task)} aria-label="Delete task">
                    <IconTrash width={14} height={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPageChange={goToPage} />
        </div>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        initialData={editingTask}
        saveFn={editingTask ? handleUpdate : handleCreate}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this task?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ""}
        confirmLabel="Delete task"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}