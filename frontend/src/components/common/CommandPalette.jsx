import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const QUICK_ACTIONS = [
  { label: "Open dashboard", path: "/", section: "Navigation" },
  { label: "View leads", path: "/leads", section: "Navigation" },
  { label: "View customers", path: "/customers", section: "Navigation" },
  { label: "View companies", path: "/companies", section: "Navigation" },
  { label: "Open pipeline", path: "/pipeline", section: "Navigation" },
  { label: "View quotes", path: "/quotes", section: "Navigation" },
  { label: "View invoices", path: "/invoices", section: "Navigation" },
  { label: "Go to reports", path: "/reports", section: "Navigation" },
  { label: "View support tickets", path: "/tickets", section: "Navigation" },
  { label: "Open knowledge base", path: "/knowledge-base", section: "Navigation" },
  { label: "View calendar", path: "/calendar", section: "Navigation" },
  { label: "Open email inbox", path: "/email", section: "Navigation" },
  { label: "Open WhatsApp", path: "/whatsapp", section: "Navigation" },
  { label: "Workflow automation", path: "/automation", section: "Navigation" },
  { label: "Manage settings", path: "/settings", section: "Navigation" },
  { label: "View users", path: "/users", section: "Navigation" },
  { label: "View audit logs", path: "/audit-logs", section: "Navigation" },
  { label: "Data export", path: "/data-export", section: "Navigation" },
  { label: "Pricing calculator", path: "/pricing", section: "Navigation" },
  { label: "Setup wizard", path: "/onboarding", section: "Navigation" },
  { label: "My profile", path: "/profile", section: "Navigation" },
  { label: "Create a lead", path: "/leads", section: "Actions" },
  { label: "Create a customer", path: "/customers", section: "Actions" },
  { label: "Create a company", path: "/companies", section: "Actions" },
  { label: "Add a deal", path: "/pipeline", section: "Actions" },
  { label: "Schedule a meeting", path: "/calendar", section: "Actions" },
  { label: "Create a quote", path: "/quotes", section: "Actions" },
  { label: "Create an invoice", path: "/invoices", section: "Actions" },
  { label: "Create a support ticket", path: "/tickets", section: "Actions" },
  { label: "Create a task", path: "/tasks", section: "Actions" },
  { label: "Schedule a follow-up", path: "/followups", section: "Actions" },
  { label: "Send an email", path: "/email", section: "Actions" },
  { label: "Send a WhatsApp message", path: "/whatsapp", section: "Actions" },
];

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const value = query.trim().toLowerCase();
    let filtered = QUICK_ACTIONS;
    if (value) {
      filtered = QUICK_ACTIONS.filter(
        (action) =>
          action.label.toLowerCase().includes(value) ||
          action.section.toLowerCase().includes(value)
      );
    }
    const groups = {};
    for (const item of filtered) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    }
    return groups;
  }, [query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 72,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: "min(640px, calc(100% - 24px))", overflow: "hidden" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: "14px 16px 8px" }}>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command or jump to a page"
            className="field-input"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ padding: "0 8px 8px", maxHeight: 400, overflowY: "auto" }}>
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", padding: "8px 8px 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {section}
              </div>
              {items.map((item) => (
                <button
                  key={item.path + item.label}
                  className="dropdown-item"
                  style={{ justifyContent: "space-between" }}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                >
                  <span>{item.label}</span>
                  <span className="text-muted">↵</span>
                </button>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
