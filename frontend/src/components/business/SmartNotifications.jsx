import { useState, useEffect } from 'react';
import { fetchNotifications, generateDailySummary } from '../../services/notifications';

function NotificationItem({ item }) {
    const priorityColors = {
        urgent: 'var(--accent-red)',
        important: 'var(--accent-amber)',
        normal: 'var(--accent-blue)',
        low: 'var(--ink-500)',
    };

    const categoryIcons = {
        task: '☐', lead: '☆', deal: '💰', followup: '↻',
        meeting: '📅', invoice: '📄', ticket: '🎫', system: '⚙',
        approval: '✓', mention: '@',
    };

    return (
        <div style={{
            display: 'flex', gap: 10, padding: '10px 0',
            borderBottom: '1px solid var(--border-light)',
            opacity: item.read ? 0.6 : 1,
        }}>
            <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: priorityColors[item.priority] || 'var(--ink-500)',
                marginTop: 6, flex: 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                    {categoryIcons[item.category] || '•'} {item.title || item.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </div>
            </div>
            {!item.read && (
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', flex: 'none', marginTop: 5,
                }} />
            )}
        </div>
    );
}

export default function SmartNotifications({ compact }) {
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetchNotifications({ per_page: compact ? 5 : 10 })
            .then(({ items, meta }) => {
                if (cancelled) return;
                setNotifications(items);
                if (items.length > 0) {
                    setSummary(generateDailySummary(items));
                }
            })
            .catch(() => { if (cancelled) return; })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [compact]);

    if (loading) {
        return (
            <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 10, width: '100%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '80%' }} />
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Notifications</span>
                {summary && (
                    <span className="badge badge-accent" style={{ fontSize: 10 }}>
                        {summary.unread} unread
                    </span>
                )}
            </div>

            {summary && (
                <div style={{
                    padding: '10px 20px', background: 'var(--accent-tint)',
                    fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.6,
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'pre-line',
                }}>
                    {summary.summary}
                </div>
            )}

            <div style={{ padding: '6px 20px', maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px 20px' }}>
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map((n, i) => <NotificationItem key={n.id || i} item={n} />)
                )}
            </div>

            {!compact && notifications.length > 5 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <button className="btn btn-ghost btn-sm">View All</button>
                </div>
            )}
        </div>
    );
}
