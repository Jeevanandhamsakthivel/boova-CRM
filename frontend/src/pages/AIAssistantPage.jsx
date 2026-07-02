import { useState } from 'react';
import NaturalLanguageSearch from '../components/ai/NaturalLanguageSearch';
import AIReportBuilder from '../components/ai/AIReportBuilder';
import DuplicateDetection from '../components/ai/DuplicateDetection';
import SmartAutomation from '../components/ai/SmartAutomation';
import PredictiveAnalytics from '../components/ai/PredictiveAnalytics';
import { Modal } from '../components/ui/Modal';
import {
    IconMessageCircle, IconSearch, IconTarget, IconLightbulb,
    IconBarChart, IconNodeWebhook as IconLink, IconZap, IconTrendUp,
} from '../components/ui/Icons';

const features = [
    {
        icon: IconMessageCircle,
        title: 'AI Business Advisor',
        description: 'Get personalized business advice based on your CRM data.',
        status: 'active',
    },
    {
        icon: IconSearch,
        title: 'Natural Language Search',
        description: 'Search your CRM using plain English queries.',
        status: 'active',
    },
    {
        icon: IconTarget,
        title: 'Next Best Action',
        description: 'AI recommends the most impactful action to take next.',
        status: 'active',
    },
    {
        icon: IconLightbulb,
        title: 'Dashboard Insights',
        description: 'AI-generated insights and trends from your data.',
        status: 'active',
    },
    {
        icon: IconBarChart,
        title: 'AI Report Builder',
        description: 'Describe the report you want and AI builds it for you.',
        status: 'active',
    },
    {
        icon: IconLink,
        title: 'Duplicate Detection',
        description: 'AI finds and merges duplicate records across your CRM.',
        status: 'active',
    },
    {
        icon: IconZap,
        title: 'Smart Automation',
        description: 'AI suggests workflow automations based on your patterns.',
        status: 'active',
    },
    {
        icon: IconTrendUp,
        title: 'Predictive Analytics',
        description: 'Forecast revenue, churn, and pipeline trends with AI.',
        status: 'active',
    },
];

export default function AIAssistantPage() {
    const [showNaturalSearch, setShowNaturalSearch] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const hasProvider = !!import.meta.env.VITE_AI_PROVIDER;

    const handleFeatureClick = (title) => {
        switch (title) {
            case 'Natural Language Search':
                setShowNaturalSearch(true);
                break;
            case 'AI Report Builder':
                setActiveModal('report-builder');
                break;
            case 'Duplicate Detection':
                setActiveModal('duplicate-detection');
                break;
            case 'Smart Automation':
                setActiveModal('smart-automation');
                break;
            case 'Predictive Analytics':
                setActiveModal('predictive-analytics');
                break;
            default:
                break;
        }
    };

    const modalProps = {
        'report-builder': {
            title: 'AI Report Builder',
            maxWidth: 640,
            children: <AIReportBuilder onClose={() => setActiveModal(null)} />,
        },
        'duplicate-detection': {
            title: 'Duplicate Detection',
            maxWidth: 640,
            children: <DuplicateDetection onClose={() => setActiveModal(null)} />,
        },
        'smart-automation': {
            title: 'Smart Automation',
            maxWidth: 640,
            children: <SmartAutomation onClose={() => setActiveModal(null)} />,
        },
        'predictive-analytics': {
            title: 'Predictive Analytics',
            maxWidth: 640,
            children: <PredictiveAnalytics onClose={() => setActiveModal(null)} />,
        },
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">AI Assistant</h1>
                    <p className="page-subtitle">Intelligent tools to help you work smarter and faster</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNaturalSearch(true)}>
                    <IconSearch width={16} height={16} />
                    Ask AI
                </button>
            </div>

            <div className={`ai-provider-banner ${hasProvider ? 'ai-provider-ready' : 'ai-provider-missing'}`}>
                <div className="ai-provider-icon">
                    {hasProvider ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={20} height={20}>
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={20} height={20}>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    )}
                </div>
                <div className="ai-provider-text">
                    <div className="ai-provider-label">
                        AI Provider: {import.meta.env.VITE_AI_PROVIDER || 'Not Configured'}
                    </div>
                    <p>
                        {!hasProvider
                            ? 'Set VITE_AI_PROVIDER (openai, gemini, ollama) in your .env file to enable AI features.'
                            : `AI provider is configured and ready. AI features will use ${import.meta.env.VITE_AI_PROVIDER}.`}
                    </p>
                </div>
            </div>

            <div className="ai-feature-grid">
                {features.map(f => {
                    const Icon = f.icon;
                    return (
                        <div key={f.title} className="ai-feature-card" onClick={() => handleFeatureClick(f.title)}>
                            <div className="ai-feature-card-top">
                                <span className="ai-feature-icon"><Icon width={22} height={22} /></span>
                                <span className="badge badge-success">Active</span>
                            </div>
                            <h3 className="ai-feature-title">{f.title}</h3>
                            <p className="ai-feature-desc">{f.description}</p>
                        </div>
                    );
                })}
            </div>

            <NaturalLanguageSearch open={showNaturalSearch} onClose={() => setShowNaturalSearch(false)} />

            {activeModal && (
                <Modal open={!!activeModal} onClose={() => setActiveModal(null)}
                    title={modalProps[activeModal].title}
                    maxWidth={modalProps[activeModal].maxWidth}
                >
                    {modalProps[activeModal].children}
                </Modal>
            )}
        </>
    );
}
