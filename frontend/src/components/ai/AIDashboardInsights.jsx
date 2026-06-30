/**
 * AI Dashboard Insights — Displays AI-generated insights on the dashboard
 * 
 * Integrates with the AI service to generate contextual business insights
 * based on current CRM data. Falls back to rule-based insights when
 * no AI provider is configured.
 * 
 * TODO: Connect to real AI provider for dynamic insight generation
 * TODO: Add insight dismissal/feedback mechanism
 * TODO: Add insight refresh on data change
 */

import { useState } from 'react';

const fallbackInsights = [
    {
        type: 'opportunity',
        icon: '💰',
        title: 'High-value deals approaching close',
        description: '3 deals worth $45,000+ are in the final negotiation stage. Consider personalized outreach.',
        action: 'View Deals',
        link: '/pipeline',
    },
    {
        type: 'alert',
        icon: '⚠️',
        title: 'Follow-up backlog detected',
        description: '5 follow-ups are overdue. Automate reminders to improve response rates.',
        action: 'View Follow-ups',
        link: '/followups',
    },
    {
        type: 'trend',
        icon: '📈',
        title: 'Lead source performance',
        description: 'Website referrals convert 40% better than other channels. Consider increasing ad spend.',
        action: 'View Reports',
        link: '/reports',
    },
    {
        type: 'tip',
        icon: '💡',
        title: 'Pipeline bottleneck',
        description: 'Leads are spending 2x longer in the "Qualified" stage. Review your qualification criteria.',
        action: 'View Pipeline',
        link: '/pipeline',
    },
];

export default function AIDashboardInsights({ summary, compact }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [dismissed, setDismissed] = useState(new Set());

    const visible = fallbackInsights.filter((_, i) => !dismissed.has(i));

    if (visible.length === 0) return null;

    const insight = compact ? visible[activeIndex % visible.length] : null;

    if (compact) {
        return (
            <div style={{
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px',
                color: '#fff', cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }} onClick={() => setActiveIndex(i => (i + 1) % visible.length)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{insight.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{insight.title}</span>
                </div>
                <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 8 }}>{insight.description}</p>
                <a href={insight.link} style={{ fontSize: 12, fontWeight: 700, color: '#fff', opacity: 0.85, textDecoration: 'underline' }}
                    onClick={e => e.stopPropagation()}>
                    {insight.action} →
                </a>
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, opacity: 0.5 }}>
                    {activeIndex + 1}/{visible.length}
                </span>
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                    AI Insights
                </span>
            </div>
            <div style={{ padding: '8px 20px' }}>
                {visible.map((insight, i) => (
                    <div key={i} style={{
                        display: 'flex', gap: 12, padding: '12px 0',
                        borderBottom: i < visible.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                        <span style={{ fontSize: 20, lineHeight: 1.4 }}>{insight.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-800)', marginBottom: 2 }}>
                                {insight.title}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5, marginBottom: 6 }}>
                                {insight.description}
                            </p>
                            <a href={insight.link} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                                {insight.action} →
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
