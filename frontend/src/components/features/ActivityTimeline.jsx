import { useState, useEffect, useCallback } from "react";
import { activitiesApi } from "../../api/miscApi";
import { formatRelative } from "../../utils/formatters";
import { IconPlus, IconCheck, IconMail, IconPhone, IconCalendar, IconEdit, IconFile } from "../ui/Icons";

const TYPE_CONFIG = {
    note: { icon: IconEdit, className: "timeline-icon-note" },
    task: { icon: IconCheck, className: "timeline-icon-task" },
    deal: { icon: IconPlus, className: "timeline-icon-deal" },
    followup: { icon: IconCalendar, className: "timeline-icon-followup" },
    file: { icon: IconFile, className: "timeline-icon-file" },
    email: { icon: IconMail, className: "timeline-icon-note" },
    call: { icon: IconPhone, className: "timeline-icon-followup" },
    created: { icon: IconPlus, className: "timeline-icon-created" },
    default: { icon: IconEdit, className: "" },
};

export function ActivityTimeline({ entityType, entityId, compact }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchActivities = useCallback(async (pageNum = 1) => {
        setLoading(true);
        try {
            const params = { page: pageNum, per_page: compact ? 5 : 20 };
            if (entityType && entityId) {
                params.entity_type = entityType;
                params.entity_id = entityId;
            }
            const res = await activitiesApi.list(params);
            const data = res?.data?.data || [];
            if (pageNum === 1) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }
            const total = res?.data?.total || 0;
            setHasMore(pageNum * (compact ? 5 : 20) < total);
        } catch {
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId, compact]);

    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    if (loading && activities.length === 0) {
        return (
            <div className="ws-tab-loading">
                <div className="spinner" />
            </div>
        );
    }

    if (!loading && activities.length === 0) {
        return (
            <div className="ws-empty-msg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ opacity: 0.4 }}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                <p>No activity recorded yet.</p>
            </div>
        );
    }

    return (
        <div className={compact ? "" : "timeline-list"}>
            {activities.map((activity, i) => {
                const type = activity.type || activity.activity_type || "default";
                const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
                const Icon = config.icon;
                return (
                    <div key={activity.id || activity._id || i} className="timeline-entry" style={compact ? { padding: "8px 0" } : undefined}>
                        {!compact && (
                            <div className={`timeline-icon ${config.className}`}>
                                <Icon width={14} height={14} />
                            </div>
                        )}
                        <div className="timeline-content">
                            <p className="timeline-description" style={compact ? { fontSize: 12 } : undefined}>
                                {activity.description || activity.title || activity.message || "Activity recorded"}
                            </p>
                            <div className="timeline-meta">
                                <span>{activity.user_name || activity.created_by_name || "System"}</span>
                                <span className="timeline-meta-dot" />
                                <span>{formatRelative(activity.created_at || activity.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            {hasMore && (
                <div style={{ padding: "12px 20px", textAlign: "center" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        const next = page + 1;
                        setPage(next);
                        fetchActivities(next);
                    }}>Load more</button>
                </div>
            )}
        </div>
    );
}
