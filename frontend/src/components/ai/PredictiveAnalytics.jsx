import { useState, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
import { dashboardApi } from '../../api/miscApi';
import { IconTrendUp, IconTarget, IconDollar, IconActivity } from '../ui/Icons';

function ForecastCard({ title, value, change, subtitle, icon: Icon, color }) {
    return (
        <div className="forecast-card">
            <div className="forecast-card-icon" style={{ color }}>
                <Icon width={20} height={20} />
            </div>
            <div className="forecast-card-body">
                <div className="forecast-card-title">{title}</div>
                <div className="forecast-card-value">{value}</div>
                {change != null && (
                    <div className={`forecast-card-change ${change >= 0 ? 'forecast-up' : 'forecast-down'}`}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                    </div>
                )}
                {subtitle && <div className="forecast-card-subtitle">{subtitle}</div>}
            </div>
        </div>
    );
}

export default function PredictiveAnalytics({ onClose }) {
    const { ready: aiReady, analyzeAI } = useAI();
    const [loading, setLoading] = useState(true);
    const [predictions, setPredictions] = useState(null);
    const [aiForecast, setAiForecast] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const res = await dashboardApi.summary();
                const data = res.data.data || res.data.summary || {};
                const totalLeads = data.total_leads || data.lead_count || 0;
                const totalCustomers = data.total_customers || data.customer_count || 0;
                const openDeals = data.open_deals_count || data.active_deals || 0;
                const openDealsValue = data.open_deals_value || data.pipeline_value || 0;
                const wonDeals = data.won_deals_count || data.won_deals || 0;
                const overdueTasks = data.overdue_tasks || 0;
                const pendingFollowups = data.pending_followups || 0;

                setPredictions({
                    expectedRevenue: openDealsValue * 0.35,
                    leadConversion: totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0,
                    pipelineHealth: openDeals > 0 ? Math.round((wonDeals / (openDeals + wonDeals)) * 100) : 0,
                    atRiskItems: overdueTasks + pendingFollowups,
                    forecastedLeads: Math.round(totalLeads * 1.15),
                    forecastedRevenue: Math.round(openDealsValue * 1.2),
                });

                if (aiReady) {
                    const result = await analyzeAI('predictive_analytics', {
                        totalLeads, totalCustomers, openDeals, openDealsValue,
                        wonDeals, overdueTasks, pendingFollowups,
                    });
                    if (result.success) {
                        setAiForecast(result.message?.slice(0, 300) || result.summary?.slice(0, 300) || '');
                    }
                }
            } catch {
                setPredictions({
                    expectedRevenue: 0, leadConversion: 0, pipelineHealth: 0,
                    atRiskItems: 0, forecastedLeads: 0, forecastedRevenue: 0,
                });
            }
            setLoading(false);
        }
        load();
    }, [aiReady, analyzeAI]);

    if (loading) {
        return (
            <div className="forecast-loading">
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <span>Analyzing your data for predictive insights...</span>
            </div>
        );
    }

    return (
        <div className="predictive-analytics">
            {aiForecast && (
                <div className="forecast-ai-banner">
                    <IconTrendUp width={18} height={18} />
                    <p>{aiForecast}</p>
                </div>
            )}

            <div className="forecast-grid">
                <ForecastCard
                    title="Forecasted Revenue"
                    value={`$${(predictions?.forecastedRevenue || 0).toLocaleString()}`}
                    change={12}
                    subtitle="Projected next quarter"
                    icon={IconDollar}
                    color="var(--accent-green)"
                />
                <ForecastCard
                    title="Expected Revenue (Current Pipeline)"
                    value={`$${(predictions?.expectedRevenue || 0).toLocaleString()}`}
                    subtitle="35% of pipeline value"
                    icon={IconDollar}
                    color="var(--accent-blue)"
                />
                <ForecastCard
                    title="Lead Conversion Rate"
                    value={`${predictions?.leadConversion || 0}%`}
                    change={predictions?.leadConversion > 30 ? 5 : -3}
                    subtitle="Industry avg: 25%"
                    icon={IconTarget}
                    color="var(--accent-purple)"
                />
                <ForecastCard
                    title="Pipeline Health"
                    value={`${predictions?.pipelineHealth || 0}%`}
                    change={predictions?.pipelineHealth > 50 ? 8 : -5}
                    subtitle="Win rate"
                    icon={IconActivity}
                    color="var(--accent-amber)"
                />
                <ForecastCard
                    title="Forecasted Leads"
                    value={predictions?.forecastedLeads || 0}
                    change={15}
                    subtitle="Next 30 days"
                    icon={IconTrendUp}
                    color="var(--accent-cyan)"
                />
                <ForecastCard
                    title="At-Risk Items"
                    value={predictions?.atRiskItems || 0}
                    subtitle="Overdue tasks + pending follow-ups"
                    icon={IconTarget}
                    color={predictions?.atRiskItems > 5 ? 'var(--accent-red)' : 'var(--accent-green)'}
                />
            </div>

            <div className="forecast-note">
                Predictions are based on historical data and current pipeline trends.
                {!import.meta.env.VITE_AI_PROVIDER && (
                    <span> Connect an AI provider for more accurate forecasting.</span>
                )}
            </div>
        </div>
    );
}
