import { useState } from 'react';
import AIBusinessAdvisor from '../components/business/AIBusinessAdvisor';
import NaturalLanguageSearch from '../components/ai/NaturalLanguageSearch';
import AINextBestAction from '../components/ai/AINextBestAction';
import AIDashboardInsights from '../components/ai/AIDashboardInsights';

const features = [
    {
        icon: '💬',
        title: 'AI Business Advisor',
        description: 'Get personalized business advice based on your CRM data.',
        status: 'active',
        component: 'AIBusinessAdvisor',
    },
    {
        icon: '🔍',
        title: 'Natural Language Search',
        description: 'Search your CRM using plain English queries.',
        status: 'active',
        component: 'NaturalLanguageSearch',
    },
    {
        icon: '🎯',
        title: 'Next Best Action',
        description: 'AI recommends the most impactful action to take next.',
        status: 'active',
        component: 'AINextBestAction',
    },
    {
        icon: '💡',
        title: 'Dashboard Insights',
        description: 'AI-generated insights and trends from your data.',
        status: 'active',
        component: 'AIDashboardInsights',
    },
    {
        icon: '📊',
        title: 'AI Report Builder',
        description: 'Describe the report you want and AI builds it for you.',
        status: 'coming-soon',
    },
    {
        icon: '🔗',
        title: 'Duplicate Detection',
        description: 'AI finds and merges duplicate records across your CRM.',
        status: 'coming-soon',
    },
    {
        icon: '⚡',
        title: 'Smart Automation',
        description: 'AI suggests workflow automations based on your patterns.',
        status: 'coming-soon',
    },
    {
        icon: '📈',
        title: 'Predictive Analytics',
        description: 'Forecast revenue, churn, and pipeline trends with AI.',
        status: 'coming-soon',
    },
];

export default function AIAssistantPage() {
    const [showNaturalSearch, setShowNaturalSearch] = useState(false);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">AI Assistant</h1>
                    <p className="page-subtitle">Intelligent tools to help you work smarter and faster</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNaturalSearch(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={16} height={16}>
                        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    Ask AI
                </button>
            </div>

            {/* Provider Status */}
            <div style={{
                background: !import.meta.env.VITE_AI_PROVIDER ? 'var(--accent-amber-tint)' : 'var(--accent-green-tint)',
                border: `1px solid ${!import.meta.env.VITE_AI_PROVIDER ? 'var(--accent-amber)' : 'var(--accent-green)'}`,
                borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <span style={{ fontSize: 20 }}>{!import.meta.env.VITE_AI_PROVIDER ? '⚙️' : '✅'}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-800)' }}>
                        AI Provider: {import.meta.env.VITE_AI_PROVIDER || 'Not Configured'}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 2 }}>
                        {!import.meta.env.VITE_AI_PROVIDER
                            ? 'Set VITE_AI_PROVIDER (openai, gemini, ollama) in your .env file to enable AI features.'
                            : 'AI provider is configured and ready. AI features will use ' + import.meta.env.VITE_AI_PROVIDER + '.'}
                    </p>
                </div>
            </div>

            {/* Feature Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {features.map(f => (
                    <div key={f.title} style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 18, display: 'flex',
                        flexDirection: 'column', gap: 8,
                        opacity: f.status === 'coming-soon' ? 0.6 : 1,
                        cursor: f.status === 'coming-soon' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 24 }}>{f.icon}</span>
                            {f.status === 'coming-soon' ? (
                                <span className="badge badge-neutral" style={{ fontSize: 10 }}>Coming Soon</span>
                            ) : (
                                <span className="badge badge-success" style={{ fontSize: 10 }}>Active</span>
                            )}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{f.title}</h3>
                        <p style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5 }}>{f.description}</p>
                    </div>
                ))}
            </div>

            <NaturalLanguageSearch open={showNaturalSearch} onClose={() => setShowNaturalSearch(false)} />
        </>
    );
}
