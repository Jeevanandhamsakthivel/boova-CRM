import { useCallback, useEffect, useRef, useState } from "react";
import { customersApi } from "../../../api/customersApi";
import { formatRelative } from "../../../utils/formatters";
import { Spinner } from "../../ui/Misc";
import {
    IconCheck, IconTasks, IconPipeline, IconFollowups,
    IconEdit, IconAlertTriangle, IconPlus, IconMail,
} from "../../ui/Icons";

/* ── Icon + colour per activity type ─────────────────────── */
const TYPE_CONFIG = {
    created:             { icon: <IconCheck   width={14} height={14} />, cls: "timeline-icon-created"  },
    note:                { icon: <IconEdit    width={14} height={14} />, cls: "timeline-icon-note"     },
    task_created:        { icon: <IconTasks   width={14} height={14} />, cls: "timeline-icon-task"     },
    task_status_change:  { icon: <IconTasks   width={14} height={14} />, cls: "timeline-icon-task"     },
    deal_created:        { icon: <IconPipeline width={14} height={14} />, cls: "timeline-icon-deal"   },
    deal_moved:          { icon: <IconPipeline width={14} height={14} />, cls: "timeline-icon-deal"   },
    followup_scheduled:  { icon: <IconFollowups width={14} height={14} />, cls: "timeline-icon-followup" },
    followup_completed:  { icon: <IconCheck    width={14} height={14} />, cls: "timeline-icon-followup" },
    file_uploaded:       { icon: <IconPlus    width={14} height={14} />, cls: "timeline-icon-file"    },
    file_deleted:        { icon: <IconAlertTriangle width={14} height={14} />, cls: "timeline-icon-file" },
};

const TYPE_LABELS = {
    note:               "Notes",
    task_created:       "Tasks Created",
    task_status_change: "Task Updates",
    deal_created:       "Deals Created",
    deal_moved:         "Deal Moves",
    followup_scheduled: "Follow-ups",
    followup_completed: "Follow-up Completed",
    file_uploaded:      "Files Uploaded",
    file_deleted:       "Files Deleted",
    created:            "Record Created",
};

function ActivityEntry({ activity }) {
    const cfg = TYPE_CONFIG[activity.type] || { icon: <span style={{ fontSize: 10 }}>●</span>, cls: "" };
    return (
        <div className="timeline-entry">
            <div className={`timeline-icon ${cfg.cls}`}>{cfg.icon}</div>
            <div className="timeline-content">
                <p className="timeline-description">{activity.description}</p>
                <span className="timeline-meta">
                    {activity.created_by && (
                        <>
                            <span>{activity.created_by}</span>
                            <span className="timeline-meta-dot" />
                        </>
                    )}
                    <span>{formatRelative(activity.created_at)}</span>
                </span>
            </div>
        </div>
    );
}

export function TimelineTab({ customerId, initialActivities }) {
    const [activities, setActivities] = useState(initialActivities || []);
    const [page, setPage]             = useState(1);
    const [hasMore, setHasMore]       = useState((initialActivities?.length ?? 0) === 20);
    const [loadingMore, setLoadingMore] = useState(false);
    const [typeFilter, setTypeFilter]   = useState("");
    const sentinelRef = useRef(null);

    useEffect(() => {
        if (!typeFilter) {
            setActivities(initialActivities || []);
            setPage(1);
            setHasMore((initialActivities?.length ?? 0) === 20);
            return;
        }
        let active = true;
        customersApi.activities(customerId, { type: typeFilter, page: 1, per_page: 20 })
            .then((res) => {
                if (!active) return;
                const data = res.data.data || [];
                setActivities(data);
                setPage(1);
                setHasMore(data.length === 20);
            });
        return () => { active = false; };
    }, [typeFilter, customerId, initialActivities]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const params = { page: nextPage, per_page: 20 };
        if (typeFilter) params.type = typeFilter;
        customersApi.activities(customerId, params)
            .then((res) => {
                const data = res.data.data || [];
                setActivities((prev) => [...prev, ...data]);
                setPage(nextPage);
                setHasMore(data.length === 20);
            })
            .finally(() => setLoadingMore(false));
    }, [loadingMore, hasMore, page, typeFilter, customerId]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [loadMore]);

    return (
        <div className="ws-tab-content">
            {/* Toolbar */}
            <div className="ws-tab-toolbar">
                <select
                    className="field-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ width: "auto", height: 32, fontSize: 13, padding: "0 10px" }}
                >
                    <option value="">All activity types</option>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <span style={{ fontSize: 12, color: "var(--ink-400)", marginLeft: "auto" }}>
                    {activities.length} {activities.length === 1 ? "entry" : "entries"}
                    {hasMore ? "+" : ""}
                </span>
            </div>

            {/* List */}
            <div className="timeline-list">
                {activities.length === 0 && (
                    <div className="ws-empty-msg">No activity yet for this customer.</div>
                )}
                {activities.map((a) => (
                    <ActivityEntry key={a.id || a._id} activity={a} />
                ))}
                <div ref={sentinelRef} style={{ height: 1 }} />
                {loadingMore && (
                    <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                        <Spinner size={16} />
                    </div>
                )}
            </div>
        </div>
    );
}
