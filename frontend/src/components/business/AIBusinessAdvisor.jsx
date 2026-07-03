import { useState, useCallback, useMemo } from 'react';
import { useAI } from '../../context/AIContext';
import { IconLightbulb, IconBarChart, IconTarget, IconZap, IconTrendUp } from '../ui/Icons';

const tips = [
    { icon: IconLightbulb, text: 'You have overdue follow-ups. Consider automating reminders to improve response rates.' },
    { icon: IconBarChart, text: 'Lead conversion is at 30%. Try A/B testing your follow-up sequences.' },
    { icon: IconTarget, text: 'Your top-performing source is Website. Consider increasing ad spend.' },
    { icon: IconZap, text: '3 deals are stuck in Negotiation stage. A personalized offer might help close them.' },
    { icon: IconTrendUp, text: 'Revenue is up 15% this quarter. Your team is performing well.' },
];

const SeverityIcon = ({ level }) => {
    const colors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
    return (
        <svg viewBox="0 0 24 24" width={18} height={18} fill={colors[level] || '#94A3B8'}>
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
};

export default function AIBusinessAdvisor({ summary, widget }) {
    const { ready: aiReady, askAI: contextAskAI } = useAI();
    const [expanded, setExpanded] = useState(!widget);
    const [query, setQuery] = useState('');
    const [thinking, setThinking] = useState(false);
    const [response, setResponse] = useState(null);

    const s = useMemo(() => summary || {}, [summary]);

    const insights = useMemo(() => {
        const items = [];
        if (s.overdue_tasks > 0) {
            items.push({ severity: 'high', text: `${s.overdue_tasks} overdue tasks require immediate attention` });
        }
        if (s.new_leads > 0) {
            items.push({ severity: 'medium', text: `${s.new_leads} new leads waiting for qualification` });
        }
        if (s.pending_followups > 0) {
            items.push({ severity: 'medium', text: `${s.pending_followups} follow-ups pending review` });
        }
        if (s.open_deals_count > 0 && s.won_deals_count > 0) {
            const winRate = Math.round((s.won_deals_count / (s.open_deals_count + s.won_deals_count)) * 100);
            items.push({ severity: winRate >= 50 ? 'low' : 'medium', text: `Win rate: ${winRate}% — ${winRate >= 50 ? 'healthy' : 'room for improvement'}` });
        }
        return items;
    }, [s]);

    const dailyTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], []);

    const handleAsk = useCallback(async () => {
        if (!query.trim()) return;
        setThinking(true);
        setResponse(null);

        try {
            const context = `CRM Dashboard Summary: ${s.total_leads || 0} total leads, ${s.total_customers || 0} customers, ${s.open_deals_count || 0} open deals worth ${s.open_deals_value || 0}, ${s.pending_tasks || 0} pending tasks, ${s.overdue_tasks || 0} overdue.`;
            const prompt = query;

            if (aiReady && contextAskAI) {
                const result = await contextAskAI(context, prompt);
                if (result.success) {
                    setResponse({
                        message: result.message,
                        suggestions: result.suggestions || [
                            'Schedule a pipeline review meeting',
                            'Set up automated follow-up sequences',
                        ],
                    });
                } else {
                    setResponse({
                        message: `Based on your CRM data, I recommend focusing on ${s.overdue_tasks > 0 ? 'clearing overdue tasks' : 'qualifying new leads'} first.`,
                        suggestions: ['Configure an AI provider for smarter responses'],
                    });
                }
            } else {
                setResponse({
                    message: `Based on your CRM data, I recommend focusing on ${s.overdue_tasks > 0 ? 'clearing overdue tasks' : 'qualifying new leads'} first. Your pipeline has ${s.open_deals_count || 0} open deals.`,
                    suggestions: [
                        'Schedule a pipeline review meeting',
                        'Set up automated follow-up sequences',
                        'Enable AI via .env for enhanced insights',
                    ],
                });
            }
        } catch {
            setResponse({
                message: `Based on your CRM data, I recommend focusing on ${s.overdue_tasks > 0 ? 'clearing overdue tasks' : 'qualifying new leads'} first.`,
                suggestions: ['Try again or configure an AI provider'],
            });
        }
        setThinking(false);
    }, [query, s, aiReady, contextAskAI]);

    const TipIcon = dailyTip.icon;

    const body = (
        <div className="ai-advisor-body">
            <div className="ai-tip-banner">
                <span className="ai-tip-icon"><TipIcon width={18} height={18} /></span>
                <span>{dailyTip.text}</span>
            </div>

            {insights.length > 0 && (
                <div className="ai-insights-section">
                    <span className="ai-section-label">Insights</span>
                    {insights.map((insight, i) => (
                        <div key={i} className="ai-insight-item">
                            <SeverityIcon level={insight.severity} />
                            <span>{insight.text}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="ai-ask-section">
                <span className="ai-section-label">Ask AI Anything</span>
                <div className="ai-ask-row">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAsk()}
                        placeholder="e.g., What should I focus on today?"
                        className="field-input"
                    />
                    <button className="btn btn-primary" onClick={handleAsk} disabled={thinking || !query.trim()}>
                        {thinking ? (
                            <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                        ) : 'Ask'}
                    </button>
                </div>

                {response && (
                    <div className="ai-response-box">
                        <p className="ai-response-text">{response.message}</p>
                        <div className="ai-suggestion-list">
                            {response.suggestions.map((s, i) => (
                                <div key={i} className="ai-suggestion-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={12} height={12}>
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="ai-advisor-footer">
                AI advisor uses your CRM data to generate insights.
                {!import.meta.env.VITE_AI_PROVIDER && (
                    <span> Configure an AI provider in Settings for enhanced responses.</span>
                )}
            </div>
        </div>
    );

    if (widget) {
        return body;
    }

    return (
        <div className="ai-card">
            <div className="ai-card-header ai-card-header-clickable" onClick={() => setExpanded(!expanded)}>
                <div className="ai-card-header-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width={20} height={20}>
                        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4zM4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8M12 8v8" />
                    </svg>
                    <span className="ai-card-title">AI Business Advisor</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}
                    className={`ai-chevron ${expanded ? 'ai-chevron-open' : ''}`}>
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>

            {expanded && body}
        </div>
    );
}
