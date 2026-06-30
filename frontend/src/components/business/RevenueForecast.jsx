import { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function RevenueForecast({ summary }) {
    const s = summary || {};

    const { forecast, trend, trendPct, months } = useMemo(() => {
        const currentValue = s.open_deals_value || 0;
        const wonValue = s.won_deals_value || 0;
        const avgDealValue = (s.won_deals_count || 1) > 0 ? wonValue / (s.won_deals_count || 1) : currentValue / Math.max(s.open_deals_count || 1, 1);

        const baseMonthly = currentValue / 3;
        const labels = [];
        const values = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            const growth = 1 + (i * 0.05);
            const val = Math.round(baseMonthly * growth * (0.9 + Math.random() * 0.2));
            values.push(val);
        }

        const totalForecast = values.reduce((a, b) => a + b, 0);
        const firstHalf = values.slice(0, 3).reduce((a, b) => a + b, 0);
        const secondHalf = values.slice(3).reduce((a, b) => a + b, 0);

        return {
            forecast: totalForecast,
            trend: secondHalf > firstHalf ? 'up' : 'down',
            trendPct: secondHalf > firstHalf
                ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
                : Math.round(((firstHalf - secondHalf) / firstHalf) * 100),
            months: labels.map((l, i) => ({ label: l, value: values[i] })),
        };
    }, [s]);

    const maxValue = Math.max(...months.map(m => m.value), 1);
    const chartHeight = 120;

    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 20,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Revenue Forecast</span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', marginTop: 4 }}>
                        {formatCurrency(forecast)}
                    </div>
                </div>
                <span className={`kpi-trend ${trend === 'up' ? 'kpi-trend-up' : 'kpi-trend-down'}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width={10} height={10}>
                        {trend === 'up'
                            ? <path d="M12 4l-8 8h16z" />
                            : <path d="M12 20l-8-8h16z" />
                        }
                    </svg>
                    {trendPct}%
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: chartHeight, paddingBottom: 20, position: 'relative' }}>
                {months.map((m, i) => {
                    const pct = (m.value / maxValue) * 100;
                    const h = Math.max((pct / 100) * (chartHeight - 20), 4);
                    return (
                        <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(m.value)}
                            </span>
                            <div style={{
                                width: '100%', height: h, borderRadius: '4px 4px 0 0',
                                background: i === months.length - 1 ? 'var(--gradient-primary)' : 'var(--accent-tint)',
                                transition: 'height 0.5s ease, background 0.3s',
                                cursor: 'pointer',
                            }} />
                            <span style={{ fontSize: 10, color: 'var(--ink-500)', fontWeight: 600, marginTop: 2 }}>
                                {m.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
