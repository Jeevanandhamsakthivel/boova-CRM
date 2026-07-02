import { useState, useCallback } from 'react';
import { useAI } from '../../context/AIContext';
import { reportsApi } from '../../api/miscApi';
import { useToast } from '../../context/ToastContext';
import { IconBarChart } from '../ui/Icons';

const PRESET_REPORTS = [
    { id: 'leads-by-status', label: 'Leads by Status', description: 'Breakdown of leads grouped by current status' },
    { id: 'leads-by-source', label: 'Leads by Source', description: 'Distribution of lead acquisition channels' },
    { id: 'deals-by-stage', label: 'Deals by Stage', description: 'Pipeline value distribution across stages' },
    { id: 'sales-performance', label: 'Sales Performance', description: 'Revenue and conversion performance over time' },
    { id: 'tasks-completion', label: 'Tasks Completion', description: 'Task completion rates and overdue stats' },
];

const API_MAP = {
    'leads-by-status': () => reportsApi.leadsByStatus().then(r => r.data.data),
    'leads-by-source': () => reportsApi.leadsBySource().then(r => r.data.data),
    'deals-by-stage': () => reportsApi.dealsByStage().then(r => r.data.data),
    'sales-performance': () => reportsApi.salesPerformance({ period: 'month' }).then(r => r.data.data),
    'tasks-completion': () => reportsApi.tasksCompletion().then(r => r.data.data),
};

function SimpleBar({ data, color = 'var(--accent)' }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="report-chart">
            {data.map((d, i) => (
                <div key={i} className="report-bar-row">
                    <span className="report-bar-label">{d.label}</span>
                    <div className="report-bar-track">
                        <div className="report-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
                    </div>
                    <span className="report-bar-value">{d.value}</span>
                </div>
            ))}
        </div>
    );
}

function SimpleDonut({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const colors = ['#6D28D9', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#8B5CF6'];
    let cumulative = 0;
    return (
        <div className="report-donut-wrap">
            <svg viewBox="0 0 120 120" className="report-donut">
                {data.map((d, i) => {
                    const pct = d.value / total;
                    const r = 50;
                    const circ = 2 * Math.PI * r;
                    const offset = cumulative * circ;
                    const len = pct * circ;
                    cumulative += pct;
                    return (
                        <circle key={i} cx="60" cy="60" r={r} fill="none"
                            stroke={colors[i % colors.length]} strokeWidth="16"
                            strokeDasharray={`${len} ${circ - len}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dasharray 0.5s' }}
                        />
                    );
                })}
                <text x="60" y="56" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink-900)">{total}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="8" fill="var(--ink-500)">Total</text>
            </svg>
            <div className="report-legend">
                {data.map((d, i) => (
                    <div key={i} className="report-legend-item">
                        <span className="report-legend-dot" style={{ background: colors[i % colors.length] }} />
                        <span className="report-legend-label">{d.label}</span>
                        <span className="report-legend-value">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReportResult({ reportId, data }) {
    if (!data) return null;
    const isDonut = reportId === 'leads-by-status' || reportId === 'leads-by-source' || reportId === 'deals-by-stage';

    if (isDonut) {
        const segments = Object.entries(data).map(([label, value]) => ({ label, value }));
        return <SimpleDonut data={segments} />;
    }

    if (reportId === 'sales-performance') {
        const segments = (data.periods || data.labels || []).map((label, i) => ({ label, value: data.values?.[i] || data.revenue?.[i] || 0 }));
        return <SimpleBar data={segments} color="var(--accent-green)" />;
    }

    if (reportId === 'tasks-completion') {
        const segments = [
            { label: 'Completed', value: data.completed || 0 },
            { label: 'Pending', value: data.pending || 0 },
            { label: 'Overdue', value: data.overdue || 0 },
        ];
        return <SimpleBar data={segments} color="var(--accent-blue)" />;
    }

    return <SimpleBar data={Object.entries(data || {}).map(([k, v]) => ({ label: k, value: v }))} />;
}

export default function AIReportBuilder({ onClose }) {
    const { ready: aiReady, generateAI } = useAI();
    const toast = useToast();
    const [selectedReport, setSelectedReport] = useState(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [generatedDesc, setGeneratedDesc] = useState('');

    const handleSelectPreset = useCallback(async (report) => {
        setSelectedReport(report);
        setLoading(true);
        setReportData(null);
        try {
            const fetcher = API_MAP[report.id];
            if (fetcher) {
                const data = await fetcher();
                setReportData(data);
                const count = Object.values(data).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                if (aiReady) {
                    const result = await generateAI('report_summary', { report: report.label, data });
                    setGeneratedDesc(result.success ? result.content.slice(0, 200) : `Showing ${count} records.`);
                } else {
                    setGeneratedDesc(`Showing ${count} records across ${Object.keys(data).length} categories.`);
                }
            }
        } catch {
            toast.error('Failed to load report data.');
        }
        setLoading(false);
    }, [aiReady, generateAI, toast]);

    const handleGenerateCustom = useCallback(async () => {
        if (!customPrompt.trim()) return;
        setSelectedReport({ id: 'custom', label: customPrompt });
        setLoading(true);
        setReportData(null);
        try {
            const result = await generateAI('custom_report', { prompt: customPrompt });
            setGeneratedDesc(result.success ? result.content.slice(0, 300) : 'Could not generate report. Try a different description.');
            setReportData({ message: result.content });
        } catch {
            toast.error('Failed to generate report.');
        }
        setLoading(false);
    }, [customPrompt, generateAI, toast]);

    return (
        <div className="report-builder">
            <div className="report-presets">
                <h4 className="report-section-title">Quick Reports</h4>
                <div className="report-preset-grid">
                    {PRESET_REPORTS.map(r => (
                        <button key={r.id}
                            className={`report-preset-card ${selectedReport?.id === r.id ? 'report-preset-active' : ''}`}
                            onClick={() => handleSelectPreset(r)}
                        >
                            <IconBarChart width={16} height={16} />
                            <div>
                                <div className="report-preset-name">{r.label}</div>
                                <div className="report-preset-desc">{r.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="report-custom">
                <div className="report-section-title">Custom Report</div>
                <div className="report-custom-row">
                    <input className="field-input" value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="Describe the report you want... e.g., 'Show me lead conversion by source this quarter'"
                        onKeyDown={e => e.key === 'Enter' && handleGenerateCustom()}
                    />
                    <button className="btn btn-primary" onClick={handleGenerateCustom} disabled={loading || !customPrompt.trim()}>
                        {loading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {loading && <div className="report-loading"><div className="spinner" style={{ width: 24, height: 24 }} /></div>}

            {reportData && (
                <div className="report-result">
                    <div className="report-result-header">
                        <h4>{selectedReport?.label}</h4>
                        {generatedDesc && <p>{generatedDesc}</p>}
                    </div>
                    <ReportResult reportId={selectedReport?.id} data={reportData} />
                </div>
            )}
        </div>
    );
}
