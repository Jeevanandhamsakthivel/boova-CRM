import { useState, useMemo } from "react";
import { calendarApi } from "../api/calendarApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";
import { IconCalendar, IconPlus } from "../components/ui/Icons";

export default function CalendarPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [status, setStatus] = useState("");

    const { items: meetings, meta, loading, reload, updateParams } = usePaginatedList(
        calendarApi.listMeetings,
        { status, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    const stats = useMemo(() => {
        const total = meta.total_count || 0;
        const scheduled = meetings.filter(m => m.status === "scheduled").length;
        const completed = meetings.filter(m => m.status === "completed").length;
        const cancelled = meetings.filter(m => m.status === "cancelled").length;
        return { total, scheduled, completed, cancelled };
    }, [meetings, meta]);

    const platformIcons = {
        google_meet: { color: "#4285F4", bg: "#4285F414", label: "Google Meet" },
        zoom: { color: "#2D8CFF", bg: "#2D8CFF14", label: "Zoom" },
        teams: { color: "#6264A7", bg: "#6264A714", label: "Teams" },
        phone: { color: "var(--ink-400)", bg: "var(--surface-sunken)", label: "Phone" },
    };

    function getPlatformBadge(platform) {
        if (!platform) return null;
        const p = platformIcons[platform] || { color: "var(--ink-300)", bg: "var(--surface-sunken)", label: platform };
        return (
            <span className="calendar-platform-badge" style={{ background: p.bg, color: p.color }}>
                {p.label}
            </span>
        );
    }

    function getInitials(str) {
        if (!str) return "?";
        return str.split(/[\s@]/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Calendar</h1>
                    <span className="page-header-subtitle">{meta.total_count} meetings</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> Schedule Meeting</Button>
                </div>
            </div>

            <div className="page-stats">
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#6366F114", color: "#6366F1" }}>
                        <IconCalendar width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.total}</span>
                        <span className="page-stat-label">Total Meetings</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#3B82F614", color: "#3B82F6" }}>
                        <IconCalendar width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.scheduled}</span>
                        <span className="page-stat-label">Scheduled</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                        <IconCalendar width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.completed}</span>
                        <span className="page-stat-label">Completed</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#EF444414", color: "#EF4444" }}>
                        <IconCalendar width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.cancelled}</span>
                        <span className="page-stat-label">Cancelled</span>
                    </div>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select className="field-select" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}>
                        <option value="">All statuses</option>
                        {["scheduled", "confirmed", "completed", "cancelled"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : meetings.length === 0 ? (
                <div className="empty-state">
                    <IconCalendar width={40} height={40} />
                    <h3>No meetings found</h3>
                    <p>Schedule your first meeting.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> Schedule Meeting</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th style={{ width: 100 }}>Type</th>
                                <th style={{ width: 120 }}>Platform</th>
                                <th style={{ width: 160 }}>Start</th>
                                <th style={{ width: 160 }}>End</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 120 }}>Attendees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(m => (
                                <tr key={m.id} className="calendar-meeting-row">
                                    <td style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{m.title}</td>
                                    <td className="cell-muted">{m.meeting_type || "—"}</td>
                                    <td>{getPlatformBadge(m.platform)}</td>
                                    <td className="cell-muted">{formatDateTime(m.start_time)}</td>
                                    <td className="cell-muted">{formatDateTime(m.end_time)}</td>
                                    <td><StatusBadge status={m.status} /></td>
                                    <td>
                                        {(m.attendees || []).length > 0 ? (
                                            <div className="calendar-attendee-avatars">
                                                {m.attendees.slice(0, 3).map((a, i) => (
                                                    <span key={i} className="calendar-attendee-avatar">{getInitials(a.email || a.name || a)}</span>
                                                ))}
                                                {m.attendees.length > 3 && (
                                                    <span className="calendar-attendee-count">+{m.attendees.length - 3}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="cell-muted">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Meeting" maxWidth={600}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">Title <span className="required">*</span></label>
                        <input className="field-input" placeholder="Meeting title" />
                    </div>
                    <div className="field-row">
                        <div className="field-group">
                            <label className="field-label">Start <span className="required">*</span></label>
                            <input className="field-input" type="datetime-local" />
                        </div>
                        <div className="field-group">
                            <label className="field-label">End <span className="required">*</span></label>
                            <input className="field-input" type="datetime-local" />
                        </div>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Platform</label>
                        <select className="field-select">
                            <option value="google_meet">Google Meet</option>
                            <option value="zoom">Zoom</option>
                            <option value="teams">Microsoft Teams</option>
                            <option value="phone">Phone</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Attendee Emails</label>
                        <input className="field-input" placeholder="email1@example.com, email2@example.com" />
                        <span className="field-hint">Separate multiple emails with commas</span>
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Meeting scheduled (demo)."); setShowCreate(false); reload(); }}>Schedule</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
