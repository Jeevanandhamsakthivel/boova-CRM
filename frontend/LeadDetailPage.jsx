import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { leadsApi } from "../../api/leadsApi";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading } from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge, TemperatureDot } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ActivityTimeline } from "../../components/common/ActivityTimeline";
import { LeadFormModal } from "../../components/leads/LeadFormModal";
import { LeadConvertModal } from "../../components/leads/LeadConvertModal";
import { IconEdit, IconTrash, IconArrowRight, IconMail, IconPhone, IconBuilding } from "../../components/ui/Icons";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/errorUtils";

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function loadLead() {
    setLoading(true);
    leadsApi
      .get(id)
      .then((res) => setLead(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  function loadActivities() {
    setActivitiesLoading(true);
    leadsApi
      .activities(id, { per_page: 30 })
      .then((res) => setActivities(res.data.data))
      .finally(() => setActivitiesLoading(false));
  }

  useEffect(() => {
    loadLead();
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(payload) {
    const res = await leadsApi.update(id, payload);
    setLead(res.data.data);
  }

  function handleUpdated() {
    toast.success("Lead updated.");
    setEditOpen(false);
    loadActivities();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await leadsApi.remove(id);
      toast.success("Lead deleted.");
      navigate("/leads");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function handleConverted({ customer }) {
    toast.success(`Converted to customer "${customer.name}".`);
    setConvertOpen(false);
    navigate(`/customers/${customer.id}`);
  }

  if (loading) return <PageLoading />;
  if (!lead) return null;

  const isConverted = lead.status === "converted";

  return (
    <div className="page-container">
      <PageHeader
        title={lead.name}
        subtitle={lead.company || "No company on file"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <IconEdit width={15} height={15} /> Edit
            </Button>
            {!isConverted && (
              <Button onClick={() => setConvertOpen(true)}>
                Convert <IconArrowRight width={15} height={15} />
              </Button>
            )}
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <IconTrash width={15} height={15} />
            </Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div className="flex-col gap-4">
          <div className="card card-pad flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} size="lg" />
              <div className="flex-col gap-1">
                <strong style={{ fontSize: 16 }}>{lead.name}</strong>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lead.status} />
                  <TemperatureDot qualification={lead.qualification} />
                </div>
              </div>
            </div>
            <hr className="divider" style={{ margin: 0 }} />
            <div className="flex-col gap-3">
              <DetailRow icon={<IconMail width={15} height={15} />} value={lead.email} />
              <DetailRow icon={<IconPhone width={15} height={15} />} value={lead.phone} />
              <DetailRow icon={<IconBuilding width={15} height={15} />} value={lead.company} />
            </div>
            <hr className="divider" style={{ margin: 0 }} />
            <div className="flex-col gap-2">
              <MetaRow label="Job title" value={lead.job_title || "—"} />
              <MetaRow label="Source" value={lead.source?.replace("_", " ")} />
              <MetaRow label="Estimated value" value={formatCurrency(lead.estimated_value)} />
              <MetaRow label="Created" value={formatDate(lead.created_at)} />
            </div>
            {lead.notes && (
              <>
                <hr className="divider" style={{ margin: 0 }} />
                <div className="flex-col gap-1">
                  <span className="field-label">Notes</span>
                  <p style={{ fontSize: 13, color: "var(--ink-600)" }}>{lead.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Activity timeline</h3>
          <ActivityTimeline activities={activities} loading={activitiesLoading} />
        </div>
      </div>

      <LeadFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={lead}
        saveFn={handleUpdate}
        onSaved={handleUpdated}
      />

      <LeadConvertModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        lead={lead}
        onConverted={handleConverted}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this lead?"
        message={`This will permanently remove "${lead.name}" and cannot be undone.`}
        confirmLabel="Delete lead"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function DetailRow({ icon, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--ink-600)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-400)" }}>{icon}</span>
      {value}
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between" style={{ fontSize: 12.5 }}>
      <span className="text-muted">{label}</span>
      <span style={{ color: "var(--ink-700)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}