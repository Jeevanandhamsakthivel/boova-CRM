/**
 * AI Next Best Action — Suggests the most impactful action a user should take
 * 
 * Uses CRM data to rank pending actions by:
 *   - Urgency (deadlines, overdue items)
 *   - Impact (deal value, lead potential)
 *   - Priority (user-set priorities, smart scoring)
 * 
 * TODO: Connect to AI provider for personalized suggestions
 * TODO: Add reinforcement learning — track which suggestions users accept
 * TODO: Add time-aware suggestions (morning vs afternoon)
 */

import { useMemo } from 'react';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function AINextBestAction({ summary }) {
    const s = summary || {};

    const actions = useMemo(() => {
        const list = [];

        if (s.overdue_tasks > 0) {
            list.push({
                id: 'overdue-tasks',
                priority: 'urgent',
                icon: '🔴',
                title: `Clear ${s.overdue_tasks} overdue task${s.overdue_tasks > 1 ? 's' : ''}`,
                description: 'Overdue tasks may be blocking your team. Prioritize these first.',
                action: 'View Tasks',
                link: '/tasks',
                impact: 90,
            });
        }

        if (s.pending_followups > 0) {
            list.push({
                id: 'pending-followups',
                priority: 'high',
                icon: '🟡',
                title: `Complete ${s.pending_followups} pending follow-up${s.pending_followups > 1 ? 's' : ''}`,
                description: 'Timely follow-ups increase conversion rates by up to 50%.',
                action: 'View Follow-ups',
                link: '/followups',
                impact: 80,
            });
        }

        if (s.new_leads > 0) {
            list.push({
                id: 'new-leads',
                priority: 'high',
                icon: '🟢',
                title: `Qualify ${s.new_leads} new lead${s.new_leads > 1 ? 's' : ''}`,
                description: 'New leads lose interest quickly. Respond within the first hour.',
                action: 'View Leads',
                link: '/leads',
                impact: 75,
            });
        }

        if (s.open_deals_count > 0) {
            list.push({
                id: 'pipeline-review',
                priority: 'medium',
                icon: '🔵',
                title: `Review ${s.open_deals_count} open deal${s.open_deals_count > 1 ? 's' : ''} in pipeline`,
                description: 'Regular pipeline reviews help identify stalled opportunities.',
                action: 'View Pipeline',
                link: '/pipeline',
                impact: 85,
            });
        }

        list.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

        return list;
    }, [s]);

    if (actions.length === 0) return null;

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                    Next Best Actions
                </span>
            </div>
            <div style={{ padding: '4px 20px' }}>
                {actions.map((a) => (
                    <div key={a.id} style={{
                        display: 'flex', gap: 12, padding: '12px 0',
                        borderBottom: '1px solid var(--border-light)',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 20, lineHeight: 1.4 }}>{a.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-800)', marginBottom: 2 }}>
                                {a.title}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5 }}>
                                {a.description}
                            </p>
                        </div>
                        <a href={a.link} className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                            {a.action}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
