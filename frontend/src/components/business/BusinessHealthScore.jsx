import { useMemo } from 'react';

const rings = [
    { key: 'revenue', label: 'Revenue', color: 'var(--accent-green)', weight: 30 },
    { key: 'pipeline', label: 'Pipeline', color: 'var(--accent)', weight: 25 },
    { key: 'tasks', label: 'Tasks', color: 'var(--accent-blue)', weight: 20 },
    { key: 'customers', label: 'Customers', color: 'var(--accent-amber)', weight: 15 },
    { key: 'engagement', label: 'Engagement', color: 'var(--accent-cyan)', weight: 10 },
];

function scoreToLevel(score) {
    if (score >= 85) return { label: 'Excellent', color: 'var(--accent-green)' };
    if (score >= 70) return { label: 'Good', color: 'var(--accent)' };
    if (score >= 50) return { label: 'Fair', color: 'var(--accent-amber)' };
    return { label: 'Needs Attention', color: 'var(--accent-red)' };
}

export default function BusinessHealthScore({ metrics }) {
    const { score, level, contributions } = useMemo(() => {
        const m = metrics || {};
        const totalLeads = m.total_leads || 1;
        const totalCustomers = m.total_customers || 0;
        const openDeals = m.open_deals_count || 0;
        const wonDeals = m.won_deals_count || 0;
        const pendingTasks = m.pending_tasks || 0;
        const totalTasks = m.total_tasks || pendingTasks;
        const overdueTasks = m.overdue_tasks || 0;

        const conversionRate = Math.min((totalCustomers / totalLeads) * 100, 100);
        const winRate = (openDeals + wonDeals) > 0 ? (wonDeals / (openDeals + wonDeals)) * 100 : 0;
        const taskCompletion = totalTasks > 0 ? ((totalTasks - pendingTasks) / totalTasks) * 100 : 0;
        const customerHealth = Math.min((totalCustomers / Math.max(totalLeads * 0.3, 1)) * 100, 100);
        const engagementScore = Math.max(0, 100 - (overdueTasks * 10));

        const contributions = {
            revenue: Math.round(Math.min(winRate * 1.2, 100)),
            pipeline: Math.round(Math.min((openDeals / Math.max(wonDeals, 1)) * 50 + 50, 100)),
            tasks: Math.round(taskCompletion),
            customers: Math.round(conversionRate),
            engagement: Math.round(engagementScore),
        };

        const rawScore = rings.reduce((sum, ring) => {
            return sum + ((contributions[ring.key] || 0) * (ring.weight / 100));
        }, 0);

        return {
            score: Math.round(Math.min(rawScore, 100)),
            level: scoreToLevel(Math.round(Math.min(rawScore, 100))),
            contributions,
        };
    }, [metrics]);

    const size = 140;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 20, display: 'flex',
            flexDirection: 'column', gap: 16,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                    Business Health Score
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: level.color, padding: '2px 10px', background: `${level.color}14`, borderRadius: 'var(--radius-full)' }}>
                    {level.label}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <svg width={size} height={size} style={{ flex: 'none' }}>
                    {rings.map((ring, i) => {
                        const pct = contributions[ring.key] || 0;
                        const offset = circumference - (pct / 100) * circumference;
                        const rotation = (i * 72) % 360;
                        return (
                            <circle
                                key={ring.key}
                                cx={center} cy={center} r={radius}
                                fill="none"
                                stroke={`${ring.color}18`}
                                strokeWidth={strokeWidth}
                                transform={`rotate(${rotation} ${center} ${center})`}
                            />
                        );
                    })}
                    {rings.map((ring, i) => {
                        const pct = contributions[ring.key] || 0;
                        const offset = circumference - (pct / 100) * circumference;
                        const rotation = (i * 72) % 360;
                        return (
                            <circle
                                key={`fg-${ring.key}`}
                                cx={center} cy={center} r={radius}
                                fill="none"
                                stroke={ring.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform={`rotate(${rotation} ${center} ${center})`}
                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                        );
                    })}
                    <text x={center} y={center - 6} textAnchor="middle" fill="var(--ink-900)"
                        fontSize={28} fontWeight={800} fontFamily="var(--font-display)">
                        {score}
                    </text>
                    <text x={center} y={center + 14} textAnchor="middle" fill="var(--ink-500)"
                        fontSize={11} fontWeight={600} fontFamily="var(--font-display)">
                        / 100
                    </text>
                </svg>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {rings.map(ring => {
                        const val = contributions[ring.key] || 0;
                        return (
                            <div key={ring.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ring.color, flex: 'none' }} />
                                <span style={{ fontSize: 12, color: 'var(--ink-600)', flex: 1 }}>{ring.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)' }}>{val}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
