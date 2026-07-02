import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../../api/customersApi";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { SearchInput, FilterSelect } from "../../components/common/FilterBar";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { IconPlus } from "../../components/ui/Icons";
import { CustomerFormModal } from "../../components/customers/CustomerFormModal";
import { formatCurrency, formatDate } from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "churned", label: "Churned" },
];

export default function CustomersListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { items, meta, loading, error, setParams, goToPage, reload } = usePaginatedList(customersApi.list, {
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    setParams({ page: 1, search: debouncedSearch || undefined, status: statusFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  async function handleCreate(payload) {
    await customersApi.create(payload);
  }

  function handleSaved() {
    toast.success("Customer created.");
    setModalOpen(false);
    reload();
  }

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.name} size="sm" />
          <div className="flex-col">
            <span className="cell-strong">{row.name}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>{row.email}</span>
          </div>
        </div>
      ),
    },
    { key: "company", header: "Company", render: (row) => row.company || <span className="cell-muted">—</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "lifetime_value", header: "Lifetime Value", render: (row) => formatCurrency(row.lifetime_value) },
    { key: "created_at", header: "Customer since", render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        subtitle="Every account your team has won, in one place."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <IconPlus width={15} height={15} /> New customer
          </Button>
        }
      />

      <div className="toolbar">
        <div className="toolbar-filters">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search customers…" />
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
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyMessage="No customers yet. Convert a lead or add one manually."
      />

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        saveFn={handleCreate}
      />
    </div>
  );
}