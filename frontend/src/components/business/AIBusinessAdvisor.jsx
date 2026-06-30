import { useState, useCallback } from 'react';

const tips = [
    { icon: '💡', text: 'You have overdue follow-ups. Consider automating reminders to improve response rates.' },
    { icon: '📊', text: 'Lead conversion is at 30%. Try A/B testing your follow-up sequences.' },
    { icon: '🎯', text: 'Your top-performing source is Website. Consider increasing ad spend.' },
    { icon: '⚡', text: '3 deals are stuck in Negotiation stage. A personalized offer might help close them.' },
    { icon: '📈', text: 'Revenue is up 15% this quarter. Your team is performing well.' },
];

export default function AIBusinessAdvisor({ summary, onAskAI }) {
    const [expanded, setExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [thinking, setThinking] = useState(false);
    const [response, setResponse] = useState(null);

    const s = summary || {};

    const insights = [];

    if (s.overdue_tasks > 0) {
        insights.push({ severity: 'high', icon: '🔴', text: `${s.overdue_tasks} overdue tasks require immediate attention` });
    }
    if (s.new_leads > 0) {
        insights.push({ severity: 'medium', icon: '🟡', text: `${s.new_leads} new leads waiting for qualification` });
    }
    if (s.pending_followups > 0) {
        insights.push({ severity: 'medium', icon: '🟡', text: `${s.pending_followups} follow-ups pending review` });
    }
    if (s.open_deals_count > 0 && s.won_deals_count > 0) {
        const winRate = Math.round((s.won_deals_count / (s.open_deals_count + s.won_deals_count)) * 100);
        insights.push({ severity: winRate >= 50 ? 'low' : 'medium', icon: winRate >= 50 ? '🟢' : '🟡', text: `Win rate: ${winRate}% — ${winRate >= 50 ? 'healthy' : 'room for improvement'}` });
    }

    const dailyTip = tips[Math.floor(Math.random() * tips.length)];

    const handleAsk = useCallback(() => {
        if (!query.trim()) return;
        setThinking(true);
        setResponse(null);

        setTimeout(() => {
            setResponse({
                message: `Based on your CRM data, I recommend focusing on ${s.overdue_tasks > 0 ? 'clearing overdue tasks' : 'qualifying new leads'} first. Your pipeline has ${s.open_deals_count || 0} open deals worth significant value. Consider reaching out to stalled opportunities.`,
                suggestions: [
                    'Schedule a pipeline review meeting',
                    'Set up automated follow-up sequences',
                    'Review lead scoring criteria',
                ],
            });
            setThinking(false);
        }, 1200);
    }, [query, s]);

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
            <div style={{
                padding: '16px 20px', borderBottom: expanded ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
            }} onClick={() => setExpanded(!expanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width={20} height={20}>
                        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4zM4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8M12 8v8" />
                    </svg>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                        AI Business Advisor
                    </span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}
                    style={{ color: 'var(--ink-500)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>

            {expanded && (
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Daily tip */}
                    <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--accent-tint)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: 18, lineHeight: 1.4 }}>{dailyTip.icon}</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>{dailyTip.text}</span>
                    </div>

                    {/* Insights */}
                    {insights.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-500)' }}>
                                Insights
                            </span>
                            {insights.map((insight, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-700)', padding: '6px 0' }}>
                                    <span>{insight.icon}</span>
                                    <span>{insight.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ask AI */}
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-500)', marginBottom: 8, display: 'block' }}>
                            Ask AI Anything
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                                placeholder="e.g., What should I focus on today?"
                                className="field-input"
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={handleAsk} disabled={thinking || !query.trim()}>
                                {thinking ? (
                                    <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                                ) : 'Ask'}
                            </button>
                        </div>

                        {response && (
                            <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--canvas)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6, marginBottom: 10 }}>{response.message}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {response.suggestions.map((s, i) => (
                                        <div key={i} style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
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

                    <div style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'center', paddingTop: 4 }}>
                        AI advisor uses your CRM data to generate insights.
                        {!import.meta.env.VITE_AI_PROVIDER && (
                            <span> Configure an AI provider in Settings for enhanced responses.</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
