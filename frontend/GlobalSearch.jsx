import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../api/miscApi";
import { useDebounce } from "../../hooks/useDebounce";
import { IconSearch, IconLeads, IconCustomers, IconTasks, IconPipeline } from "../ui/Icons";

const TYPE_META = {
  leads: { label: "Leads", icon: IconLeads, path: "/leads" },
  customers: { label: "Customers", icon: IconCustomers, path: "/customers" },
  tasks: { label: "Tasks", icon: IconTasks, path: "/tasks" },
  deals: { label: "Deals", icon: IconPipeline, path: "/pipeline" },
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 350);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchApi
      .search(debounced)
      .then((res) => setResults(res.data.data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && Object.values(results).some((arr) => arr?.length > 0);

  function goTo(type, id) {
    setOpen(false);
    setQuery("");
    navigate(`${TYPE_META[type].path}/${id}`);
  }

  return (
    <div className="topbar-search" ref={wrapRef} style={{ position: "relative" }}>
      <IconSearch />
      <input
        placeholder="Search leads, customers, tasks, deals…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() && (
        <div className="dropdown-menu" style={{ left: 0, right: 0, minWidth: "100%", maxHeight: 360, overflowY: "auto" }}>
          {loading && <div className="dropdown-item text-muted">Searching…</div>}
          {!loading && !hasResults && <div className="dropdown-item text-muted">No matches found.</div>}
          {!loading &&
            hasResults &&
            Object.entries(results).map(([type, items]) =>
              items?.length ? (
                <div key={type}>
                  <div className="dropdown-item text-muted" style={{ cursor: "default", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                    {TYPE_META[type].label}
                  </div>
                  {items.map((item) => (
                    <div key={item.id} className="dropdown-item" onClick={() => goTo(type, item.id)}>
                      <TYPE_META[type].icon width={15} height={15} />
                      {item.name || item.title}
                    </div>
                  ))}
                </div>
              ) : null
            )}
        </div>
      )}
    </div>
  );
}