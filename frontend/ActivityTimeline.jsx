import { formatRelative, titleCase } from "../../utils/formatters";
import { EmptyState } from "../ui/Misc";
import { IconFollowups } from "../ui/Icons";

export function ActivityTimeline({ activities, loading }) {
  if (loading) return <p className="text-muted text-sm">Loading activity…</p>;

  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={<IconFollowups width={28} height={28} />}
        title="No activity yet"
        message="Updates, status changes, and notes will appear here."
      />
    );
  }

  return (
    <div className="flex-col gap-3">
      {activities.map((a) => (
        <div key={a.id} style={{ display: "flex", gap: 10, fontSize: 13 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", marginTop: 5, flex: "none" }} />
          <div className="flex-col gap-1">
            <span style={{ color: "var(--ink-700)" }}>{a.description}</span>
            <span className="text-muted" style={{ fontSize: 11.5 }}>
              {titleCase(a.type)} · {formatRelative(a.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}