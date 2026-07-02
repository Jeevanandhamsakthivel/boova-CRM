import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leadsApi } from "../../api/leadsApi";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { SearchInput, FilterSelect } from "../../components/common/FilterBar";
import { StatusBadge, TemperatureDot } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { IconPlus } from "../../components/ui/Icons";
import { LeadFormModal } from "../../components/leads/LeadFormModal";
import { formatCurrency, formatDate } from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export default function LeadsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { items, meta, loading, error, setParams, goToPage, reload } = usePaginatedList(leadsApi.list, {
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    setParams({ page: 1, search: debouncedSearch || undefined, status: statusFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  async function handleCreate(payload) {
    await leadsApi.create(payload);
  }

  function handleSaved() {
    toast.success("Lead created.");
    setModalOpen(false);
    reload();
  }

  const columns = [
    {
      key: "name",
      header: "Lead",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.name} size="sm" />
          <div className="flex-col">
            <span className="cell-strong">{row.name}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>{row.email || "No email"}</span>
          </div>
        </div>
      ),
    },
    { key: "company", header: "Company", render: (row) => row.company || <span className="cell-muted">—</span> },
    {
      key: "qualification",
      header: "Temp",
      width: 70,
      render: (row) => <TemperatureDot qualification={row.qualification} />,
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "source", header: "Source", render: (row) => <span className="cell-muted">{row.source?.replace("_", " ")}</span> },
    { key: "estimated_value", header: "Est. Value", render: (row) => formatCurrency(row.estimated_value) },
    { key: "created_at", header: "Created", render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Leads"
        subtitle="Track every prospect from first touch to qualification."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <IconPlus width={15} height={15} /> New lead
          </Button>
        }
      />

      <div className="toolbar">
        <div className="toolbar-filters">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search leads…" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All statuses" />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={goToPage}
        onRowClick={(row) => navigate(`/leads/${row.id}`)}
        emptyMessage="No leads yet. Create your first lead to get started."
      />

      <LeadFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        saveFn={handleCreate}
      />
    </div>
  );
}