import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../context/AIContext';
import { workflowTemplatesApi } from '../../api/workflowsApi';
import { useToast } from '../../context/ToastContext';
import { IconZap, IconArrowRight } from '../ui/Icons';

const STATIC_SUGGESTIONS = [
    {
        id: 'lead-followup',
        title: 'Lead Follow-up Automation',
        description: 'Automatically assign and notify sales reps when new leads come in, with scheduled follow-up reminders.',
        category: 'sales',
        impact: 'high',
    },
    {
        id: 'deal-approval',
        title: 'Deal Approval Workflow',
        description: 'Multi-stage approval pipeline for high-value deals with manager notifications and escalation paths.',
        category: 'sales',
        impact: 'high',
    },
    {
        id: 'ticket-routing',
        title: 'Intelligent Ticket Routing',
        description: 'Auto-assign support tickets based on skill, workload, and priority with SLA tracking.',
        category: 'support',
        impact: 'medium',
    },
    {
        id: 'onboarding',
        title: 'Customer Onboarding Sequence',
        description: 'Welcome emails, task creation, and milestone tracking for new customer onboarding.',
        category: 'customer',
        impact: 'medium',
    },
    {
        id: 'invoice-reminder',
        title: 'Invoice & Payment Reminders',
        description: 'Automated payment reminders, overdue escalation, and invoice status tracking.',
        category: 'finance',
        impact: 'high',
    },
    {
        id: 'data-cleanup',
        title: 'Data Quality Maintenance',
        description: 'Scheduled data cleanup, duplicate detection, and enrichment automation.',
        category: 'admin',
        impact: 'low',
    },
];

export default function SmartAutomation({ onClose }) {
    const { ready: aiReady, analyzeAI } = useAI();
    const navigate = useNavigate();
    const toast = useToast();
    const [templates, setTemplates] = useState(STATIC_SUGGESTIONS);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(null);

    useEffect(() => {
        workflowTemplatesApi.list({ per_page: 20 })
            .then(res => {
                const apiTemplates = res.data.data || [];
                if (apiTemplates.length > 0) {
                    setTemplates(apiTemplates.map(t => ({
                        id: t.id || t._id,
                        title: t.name || t.title,
                        description: t.description,
                        category: t.category || 'general',
                        impact: t.impact || 'medium',
                        _isApi: true,
                    })));
                }
            })
            .catch((err) => console.error("Failed to load workflow templates:", err));
    }, []);

    useEffect(() => {
        if (aiReady && templates.length > 0) {
            analyzeAI('automation_suggestions', { availableTemplates: templates.length, categories: [...new Set(templates.map(t => t.category))] })
                .then(result => {
                    if (result.success && result.recommendations) {
                        setAiSuggestions(result.recommendations.slice(0, 3));
                    }
                }).catch((err) => console.error("AI automation suggestions failed:", err));
        }
    }, [aiReady, templates, analyzeAI]);

    const handleApply = useCallback(async (tmpl) => {
        setApplying(tmpl.id);
        try {
            if (tmpl._isApi) {
                await workflowTemplatesApi.apply(tmpl.id);
            }
            toast.success(`"${tmpl.title}" workflow created! Redirecting to builder...`);
            navigate('/workflows/builder');
            onClose?.();
        } catch {
            if (!tmpl._isApi) {
                toast.success(`"${tmpl.title}" template ready! Opening workflow builder...`);
                navigate('/workflows/builder');
                onClose?.();
            } else {
                toast.error('Failed to apply template. You can create it manually in the workflow builder.');
            }
        }
        setApplying(null);
    }, [navigate, toast, onClose]);

    return (
        <div className="smart-automation">
            {aiSuggestions.length > 0 && (
                <div className="sa-ai-suggestions">
                    <div className="sa-section-title">
                        <IconZap width={14} height={14} />
                        AI Recommendations
                    </div>
                    <div className="sa-ai-list">
                        {aiSuggestions.map((s, i) => (
                            <div key={i} className="sa-ai-chip">{s}</div>
                        ))}
                    </div>
                </div>
            )}

            <div className="sa-section-title">Available Automation Templates</div>

            {loading ? (
                <div className="sa-loading"><div className="spinner" style={{ width: 24, height: 24 }} /></div>
            ) : (
                <div className="sa-template-grid">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="sa-template-card">
                            <div className="sa-template-top">
                                <span className={`sa-impact-badge sa-impact-${tmpl.impact}`}>{tmpl.impact}</span>
                                <span className="sa-category-badge">{tmpl.category}</span>
                            </div>
                            <h4 className="sa-template-title">{tmpl.title}</h4>
                            <p className="sa-template-desc">{tmpl.description}</p>
                            <button className="btn btn-sm btn-primary"
                                onClick={() => handleApply(tmpl)}
                                disabled={applying === tmpl.id}
                            >
                                {applying === tmpl.id ? 'Applying...' : (
                                    <><IconArrowRight width={12} height={12} /> Apply</>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
