import { useState, useEffect, useMemo } from 'react';
import { useAI } from '../../context/AIContext';
import { IconDollar, IconAlertTriangle, IconTrendUp, IconLightbulb } from '../ui/Icons';

const fallbackInsights = [
    {
        type: 'opportunity',
        icon: IconDollar,
        title: 'High-value deals approaching close',
        description: '3 deals worth $45,000+ are in the final negotiation stage. Consider personalized outreach.',
        action: 'View Deals',
        link: '/pipeline',
    },
    {
        type: 'alert',
        icon: IconAlertTriangle,
        title: 'Follow-up backlog detected',
        description: '5 follow-ups are overdue. Automate reminders to improve response rates.',
        action: 'View Follow-ups',
        link: '/followups',
    },
    {
        type: 'trend',
        icon: IconTrendUp,
        title: 'Lead source performance',
        description: 'Website referrals convert 40% better than other channels. Consider increasing ad spend.',
        action: 'View Reports',
        link: '/reports',
    },
    {
        type: 'tip',
        icon: IconLightbulb,
        title: 'Pipeline bottleneck',
        description: 'Leads are spending 2x longer in the "Qualified" stage. Review your qualification criteria.',
        action: 'View Pipeline',
        link: '/pipeline',
    },
];

const AI_INSIGHT_COLORS = {
    opportunity: { bg: 'var(--accent-green-tint)', border: 'var(--accent-green)', icon: 'var(--accent-green)' },
    alert: { bg: 'var(--accent-red-tint)', border: 'var(--accent-red)', icon: 'var(--accent-red)' },
    trend: { bg: 'var(--accent-blue-tint)', border: 'var(--accent-blue)', icon: 'var(--accent-blue)' },
    tip: { bg: 'var(--accent-amber-tint)', border: 'var(--accent-amber)', icon: 'var(--accent-amber)' },
    ai: { bg: 'var(--accent-purple-tint)', border: 'var(--accent-purple)', icon: 'var(--accent-purple)' },
};

export default function AIDashboardInsights({ summary, compact }) {
    const { ready: aiReady, analyzeAI } = useAI();
    const [activeIndex, setActiveIndex] = useState(0);
    const [dismissed] = useState(new Set());
    const [aiInsights, setAiInsights] = useState(null);

    useEffect(() => {
        if (aiReady && summary) {
            analyzeAI('dashboard', {
                total_leads: summary.total_leads,
                total_customers: summary.total_customers,
                open_deals: summary.open_deals_count,
                open_deals_value: summary.open_deals_value,
                won_deals: summary.won_deals_count,
                pending_tasks: summary.pending_tasks,
                overdue_tasks: summary.overdue_tasks,
                pending_followups: summary.pending_followups,
                new_leads: summary.new_leads,
            }).then(result => {
                if (result.success) {
                    setAiInsights([{
                        type: 'ai',
                        icon: IconLightbulb,
                        title: 'AI Analysis',
                        description: result.message?.slice(0, 150) || 'Analysis complete.',
                        action: 'View Details',
                        link: '/ai-assistant',
                    }]);
                }
            }).catch((err) => console.error("Failed to load dashboard insights:", err));
        }
    }, [aiReady, summary, analyzeAI]);

    const allInsights = useMemo(() => {
        return [...(aiInsights || []), ...fallbackInsights];
    }, [aiInsights]);

    const visible = allInsights.filter((_, i) => !dismissed.has(i));

    if (visible.length === 0) return null;

    const insight = compact ? visible[activeIndex % visible.length] : null;

    if (compact) {
        const colors = AI_INSIGHT_COLORS[insight.type] || AI_INSIGHT_COLORS.tip;
        const Icon = insight.icon;
        return (
            <div
                className="ai-insight-compact"
                style={{ background: colors.bg, borderColor: colors.border }}
                onClick={() => setActiveIndex(i => (i + 1) % visible.length)}
            >
                <div className="ai-insight-compact-top">
                    <span className="ai-insight-compact-icon" style={{ color: colors.icon }}>
                        <Icon width={18} height={18} />
                    </span>
                    <span className="ai-insight-compact-title">{insight.title}</span>
                </div>
                <p className="ai-insight-compact-desc">{insight.description}</p>
                <a href={insight.link} className="ai-insight-link" onClick={e => e.stopPropagation()}>
                    {insight.action} &rarr;
                </a>
                <span className="ai-insight-counter">{activeIndex + 1}/{visible.length}</span>
            </div>
        );
    }

    return (
        <div className="ai-card">
            <div className="ai-card-header">
                <span className="ai-card-title">AI Insights</span>
            </div>
            <div className="ai-card-body ai-insights-list">
                {visible.map((insight, i) => {
                    const Icon = insight.icon;
                    const colors = AI_INSIGHT_COLORS[insight.type] || AI_INSIGHT_COLORS.tip;
                    return (
                        <div key={i} className="ai-insight-row">
                            <span className="ai-insight-icon" style={{ color: colors.icon }}>
                                <Icon width={18} height={18} />
                            </span>
                            <div className="ai-insight-content">
                                <div className="ai-insight-title">{insight.title}</div>
                                <p className="ai-insight-desc">{insight.description}</p>
                                <a href={insight.link} className="ai-insight-link">{insight.action} &rarr;</a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
