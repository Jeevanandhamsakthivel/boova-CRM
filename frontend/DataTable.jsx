import { EmptyState, PageLoading } from "../ui/Misc";
import { Pagination } from "../ui/Misc";
import { IconSearch } from "../ui/Icons";

/**
 * Generic data table. `columns` is [{ key, header, render(row) }].
 * Clicking a row calls onRowClick(row) if provided.
 */
export function DataTable({ columns, rows, loading, error, meta, onPageChange, onRowClick, emptyMessage }) {
  if (loading) return <PageLoading />;

  if (error) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconSearch width={32} height={32} />}
          title="Couldn't load data"
          message={error}
        />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconSearch width={32} height={32} />}
          title="Nothing here yet"
          message={emptyMessage || "No records match your current filters."}
        />
      </div>
    );
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  );
}