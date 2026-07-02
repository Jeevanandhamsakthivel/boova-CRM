import { useMemo, useEffect, useState } from 'react';
import { useAI } from '../../context/AIContext';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

const PriorityIcon = ({ level }) => {
    const colors = { urgent: '#EF4444', high: '#F59E0B', medium: '#10B981', low: '#3B82F6' };
    return (
        <svg viewBox="0 0 24 24" width={20} height={20} fill={colors[level] || '#94A3B8'}>
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
};

export default function AINextBestAction({ summary }) {
    const { ready: aiReady, analyzeAI } = useAI();
    const [aiPriority, setAiPriority] = useState(null);
    const s = useMemo(() => summary || {}, [summary]);

    useEffect(() => {
        if (aiReady && s.open_deals_count > 0) {
            analyzeAI('next_best_action', {
                overdue_tasks: s.overdue_tasks,
                pending_followups: s.pending_followups,
                new_leads: s.new_leads,
                open_deals: s.open_deals_count,
                open_deals_value: s.open_deals_value,
            }).then(result => {
                if (result.success && result.message) {
                    setAiPriority(result.message.slice(0, 200));
                }
            }).catch(() => {});
        }
    }, [aiReady, s, analyzeAI]);

    const actions = useMemo(() => {
        const list = [];

        if (s.overdue_tasks > 0) {
            list.push({
                id: 'overdue-tasks',
                priority: 'urgent',
                title: `Clear ${s.overdue_tasks} overdue task${s.overdue_tasks > 1 ? 's' : ''}`,
                description: aiPriority || 'Overdue tasks may be blocking your team. Prioritize these first.',
                action: 'View Tasks',
                link: '/tasks',
                impact: 90,
            });
        }

        if (s.pending_followups > 0) {
            list.push({
                id: 'pending-followups',
                priority: 'high',
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
                title: `Review ${s.open_deals_count} open deal${s.open_deals_count > 1 ? 's' : ''} in pipeline`,
                description: 'Regular pipeline reviews help identify stalled opportunities.',
                action: 'View Pipeline',
                link: '/pipeline',
                impact: 85,
            });
        }

        list.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

        return list;
    }, [s, aiPriority]);

    if (actions.length === 0) return null;

    return (
        <div className="ai-card">
            <div className="ai-card-header">
                <span className="ai-card-title">Next Best Actions</span>
            </div>
            <div className="ai-card-body">
                {actions.map((a) => (
                    <div key={a.id} className="ai-action-row">
                        <PriorityIcon level={a.priority} />
                        <div className="ai-action-content">
                            <div className="ai-action-title">{a.title}</div>
                            <p className="ai-action-desc">{a.description}</p>
                        </div>
                        <a href={a.link} className="btn btn-sm btn-primary">{a.action}</a>
                    </div>
                ))}
            </div>
        </div>
    );
}
