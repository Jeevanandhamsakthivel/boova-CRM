import { followupsApi } from "../../../api/followupsApi";
import { useTabLoad } from "../../../hooks/useTabLoad";
import { StatusBadge } from "../../ui/Badge";
import { Spinner } from "../../ui/Misc";
import { formatDate } from "../../../utils/formatters";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useToast } from "../../../context/ToastContext";
import { IconCheck } from "../../ui/Icons";

const TYPE_ICON = { call: "📞", email: "✉️", meeting: "🤝", other: "📋" };

function isOverdue(f) {
    return f.status === "pending" && new Date(f.due_date) < new Date();
}

function sortFollowups(items) {
    return [...items].sort((a, b) => {
        const aPri = ["pending", "overdue"].includes(a.status) ? 0 : 1;
        const bPri = ["pending", "overdue"].includes(b.status) ? 0 : 1;
        if (aPri !== bPri) return aPri - bPri;
        return new Date(a.due_date) - new Date(b.due_date);
    });
}

export function FollowUpsTab({ customerId, activeTab }) {
    const toast = useToast();
    const { items, setItems, loading, error, reload } = useTabLoad(
        "followups",
        activeTab,
        () => followupsApi.list({ related_to_id: customerId, per_page: 100 })
    );

    async function handleComplete(followup) {
        setItems((prev) => prev.map((f) => f.id === followup.id ? { ...f, status: "completed" } : f));
        try {
            await followupsApi.update(followup.id, { status: "completed" });
        } catch (err) {
            setItems((prev) => prev.map((f) => f.id === followup.id ? { ...f, status: followup.status } : f));
            toast.error(getErrorMessage(err));
        }
    }

    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return (
        <div className="ws-tab-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Retry</button>
        </div>
    );

    const sorted = sortFollowups(items);

    return (
        <div className="ws-tab-content">
            {sorted.length === 0 ? (
                <div className="ws-empty-msg">No follow-ups yet. Use "+ Follow-up" to schedule one.</div>
            ) : (
                <div className="ws-list">
                    {sorted.map((f) => {
                        const overdue = isOverdue(f);
                        return (
                            <div
                                key={f.id}
                                className={`ws-list-row${overdue ? " ws-row-overdue" : ""}`}
                            >
                                {/* Type icon */}
                                <span style={{
                                    fontSize: 18,
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "var(--surface-sunken)",
                                    borderRadius: "var(--radius-sm)",
                                    flexShrink: 0,
                                }}>
                                    {TYPE_ICON[f.type] || "📋"}
                                </span>

                                <div className="ws-list-row-main">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="ws-list-title">{f.title}</span>
                                        {overdue && (
                                            <span className="badge badge-danger" style={{ fontSize: 10 }}>Overdue</span>
                                        )}
                                    </div>
                                    <div className="ws-list-meta">
                                        <StatusBadge status={f.status} />
                                        {f.due_date && (
                                            <>
                                                <span className="ws-meta-sep" />
                                                <span className="ws-meta-text"
                                                    style={overdue ? { color: "var(--danger)", fontWeight: 600 } : undefined}>
                                                    {formatDate(f.due_date)}
                                                </span>
                                            </>
                                        )}
                                        {f.assigned_to && (
                                            <>
                                                <span className="ws-meta-sep" />
                                                <span className="ws-meta-text">{f.assigned_to}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Complete button */}
                                {f.status === "pending" && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleComplete(f)}
                                        title="Mark complete"
                                        style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                        <IconCheck width={13} height={13} />
                                        Done
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
