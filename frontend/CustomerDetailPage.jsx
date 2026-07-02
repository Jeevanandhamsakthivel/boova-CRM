import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customersApi } from "../../api/customersApi";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading } from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ActivityTimeline } from "../../components/common/ActivityTimeline";
import { CustomerFormModal } from "../../components/customers/CustomerFormModal";
import { IconEdit, IconTrash, IconMail, IconPhone, IconBuilding } from "../../components/ui/Icons";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/errorUtils";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function loadCustomer() {
    setLoading(true);
    customersApi
      .get(id)
      .then((res) => setCustomer(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  function loadDeals() {
    customersApi.deals(id, { per_page: 10 }).then((res) => setDeals(res.data.data));
  }

  function loadActivities() {
    setActivitiesLoading(true);
    customersApi
      .activities(id, { per_page: 30 })
      .then((res) => setActivities(res.data.data))
      .finally(() => setActivitiesLoading(false));
  }

  useEffect(() => {
    loadCustomer();
    loadDeals();
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(payload) {
    const res = await customersApi.update(id, payload);
    setCustomer(res.data.data);
  }

  function handleUpdated() {
    toast.success("Customer updated.");
    setEditOpen(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await customersApi.remove(id);
      toast.success("Customer deleted.");
      navigate("/customers");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) return <PageLoading />;
  if (!customer) return null;

  return (
    <div className="page-container">
      <PageHeader
        title={customer.name}
        subtitle={customer.company || "No company on file"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <IconEdit width={15} height={15} /> Edit
            </Button>
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
              <Avatar name={customer.name} size="lg" />
              <div className="flex-col gap-1">
                <strong style={{ fontSize: 16 }}>{customer.name}</strong>
                <StatusBadge status={customer.status} />
              </div>
            </div>
            <hr className="divider" style={{ margin: 0 }} />
            <div className="flex-col gap-3">
              <DetailRow icon={<IconMail width={15} height={15} />} value={customer.email} />
              <DetailRow icon={<IconPhone width={15} height={15} />} value={customer.phone} />
              <DetailRow icon={<IconBuilding width={15} height={15} />} value={customer.company} />
            </div>
            <hr className="divider" style={{ margin: 0 }} />
            <div className="flex-col gap-2">
              <MetaRow label="Lifetime value" value={formatCurrency(customer.lifetime_value)} />
              <MetaRow label="Customer since" value={formatDate(customer.created_at)} />
            </div>
            {customer.notes && (
              <>
                <hr className="divider" style={{ margin: 0 }} />
                <div className="flex-col gap-1">
                  <span className="field-label">Notes</span>
                  <p style={{ fontSize: 13, color: "var(--ink-600)" }}>{customer.notes}</p>
                </div>
              </>
            )}
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 12 }}>Deals</h3>
            {deals.length === 0 ? (
              <p className="text-muted text-sm">No deals yet for this customer.</p>
            ) : (
              <div className="flex-col gap-2">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between"
                    style={{ padding: "8px 0", borderBottom: "1px solid var(--border-hairline)", cursor: "pointer" }}
                    onClick={() => navigate("/pipeline")}
                  >
                    <span style={{ fontSize: 13 }}>{deal.title}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-strong)" }}>
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Activity timeline</h3>
          <ActivityTimeline activities={activities} loading={activitiesLoading} />
        </div>
      </div>

      <CustomerFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={customer}
        saveFn={handleUpdate}
        onSaved={handleUpdated}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this customer?"
        message={`This will permanently remove "${customer.name}" and cannot be undone.`}
        confirmLabel="Delete customer"
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