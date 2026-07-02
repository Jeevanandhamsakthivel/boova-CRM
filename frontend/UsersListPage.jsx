import { useEffect, useState } from "react";
import { usersApi } from "../../api/miscApi";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { SearchInput, FilterSelect } from "../../components/common/FilterBar";
import { StatusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Select } from "../../components/ui/FormFields";
import { getErrorMessage } from "../../utils/errorUtils";
import { formatDate } from "../../utils/formatters";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function UsersListPage() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [roleFilter, setRoleFilter] = useState("");

  const { items, meta, loading, error, setParams, goToPage, reload } = usePaginatedList(usersApi.list, {
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    setParams({ page: 1, search: debouncedSearch || undefined, role: roleFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter]);

  async function handleRoleChange(user, newRole) {
    try {
      await usersApi.update(user.id, { role: newRole });
      toast.success(`${user.name}'s role updated to ${newRole}.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleStatusChange(user, newStatus) {
    try {
      await usersApi.update(user.id, { status: newStatus });
      toast.success(`${user.name}'s status updated.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "name",
      header: "User",
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
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Select
          options={ROLE_OPTIONS}
          value={row.role}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          style={{ height: 32, width: "auto" }}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Select
          options={STATUS_OPTIONS}
          value={row.status}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          style={{ height: 32, width: "auto" }}
        />
      ),
    },
    { key: "created_at", header: "Joined", render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Users" subtitle="Manage your team's access and roles." />

      <div className="toolbar">
        <div className="toolbar-filters">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search users…" />
          <FilterSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} placeholder="All roles" />
        </div>
      </div>

      <DataTable columns={columns} rows={items} loading={loading} error={error} meta={meta} onPageChange={goToPage} />
    </div>
  );
}