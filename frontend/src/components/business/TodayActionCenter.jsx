import { Link } from 'react-router-dom';

function ActionItem({ icon, label, count, to, accent, sub }) {
    return (
        <Link to={to} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: '1px solid var(--border-light)', textDecoration: 'none',
            transition: 'opacity 0.15s',
        }}>
            <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-tint)', color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flex: 'none', fontSize: 16,
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 1 }}>{sub}</div>}
            </div>
            <div style={{
                fontSize: 16, fontWeight: 800, color: accent,
                fontVariantNumeric: 'tabular-nums',
            }}>
                {count ?? 0}
            </div>
        </Link>
    );
}

export default function TodayActionCenter({ summary }) {
    const s = summary || {};

    const hasItems = (s.overdue_tasks || 0) + (s.pending_followups || 0) + (s.new_leads || 0) + (s.open_deals_count || 0) > 0;

    return (
        <div style={{ height: '100%' }}>
            <div style={{ padding: '4px 20px' }}>
                {!hasItems ? (
                    <div className="empty-state" style={{ padding: '30px 20px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={32} height={32} style={{ color: 'var(--accent-green)' }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
                        </svg>
                        <h3 style={{ color: 'var(--accent-green)', fontSize: 14 }}>All caught up!</h3>
                        <p>No urgent items need your attention.</p>
                    </div>
                ) : (
                    <>
                        <ActionItem
                            icon="🔴"
                            label="Overdue Tasks"
                            count={s.overdue_tasks}
                            to="/tasks"
                            accent="var(--accent-red)"
                            sub={s.overdue_tasks > 0 ? 'Requires immediate action' : 'All tasks on track'}
                        />
                        <ActionItem
                            icon="🟡"
                            label="Pending Follow-ups"
                            count={s.pending_followups}
                            to="/followups"
                            accent="var(--accent-amber)"
                            sub="Review and complete"
                        />
                        <ActionItem
                            icon="🟢"
                            label="New Leads to Review"
                            count={s.new_leads}
                            to="/leads"
                            accent="var(--accent)"
                            sub="Awaiting qualification"
                        />
                        <ActionItem
                            icon="🔵"
                            label="Open Deals"
                            count={s.open_deals_count}
                            to="/pipeline"
                            accent="var(--accent-blue)"
                            sub="In active pipeline"
                        />
                    </>
                )}
            </div>
        </div>
    );
}
