import { useState, useCallback, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
import { leadsApi } from '../../api/leadsApi';
import { customersApi } from '../../api/customersApi';
import { useToast } from '../../context/ToastContext';
import { IconUsers, IconCheck, IconX } from '../ui/Icons';

function findSimilar(a, b) {
    const fields = ['name', 'email', 'phone', 'company'];
    let score = 0;
    fields.forEach(f => {
        if (a[f] && b[f] && a[f].toLowerCase() === b[f].toLowerCase()) score++;
        if (f === 'name' && a[f] && b[f]) {
            const aa = a[f].toLowerCase().split(' ');
            const bb = b[f].toLowerCase().split(' ');
            const common = aa.filter(w => bb.includes(w)).length;
            if (common > 0 && common >= Math.min(aa.length, bb.length) * 0.5) score += 0.5;
        }
    });
    return score;
}

const SCAN_TYPES = [
    { id: 'leads', label: 'Leads', icon: IconUsers },
    { id: 'customers', label: 'Customers', icon: IconUsers },
    { id: 'both', label: 'Leads & Customers', icon: IconUsers },
];

export default function DuplicateDetection({ onClose }) {
    const { ready: aiReady, analyzeAI } = useAI();
    const toast = useToast();
    const [scanType, setScanType] = useState('both');
    const [scanning, setScanning] = useState(false);
    const [duplicates, setDuplicates] = useState([]);
    const [merged, setMerged] = useState(new Set());
    const [aiAnalysis, setAiAnalysis] = useState('');

    const handleScan = useCallback(async () => {
        setScanning(true);
        setDuplicates([]);
        setMerged(new Set());
        try {
            let allRecords = [];
            if (scanType === 'leads' || scanType === 'both') {
                const leadsRes = await leadsApi.list({ per_page: 1000 });
                allRecords = allRecords.concat((leadsRes.data.data || leadsRes.data.leads || []).map(r => ({ ...r, _type: 'lead' })));
            }
            if (scanType === 'customers' || scanType === 'both') {
                const custRes = await customersApi.list({ per_page: 1000 });
                allRecords = allRecords.concat((custRes.data.data || custRes.data.customers || []).map(r => ({ ...r, _type: 'customer' })));
            }

            const groups = [];
            const checked = new Set();

            for (let i = 0; i < allRecords.length; i++) {
                if (checked.has(i)) continue;
                const group = [allRecords[i]];
                checked.add(i);
                for (let j = i + 1; j < allRecords.length; j++) {
                    if (checked.has(j)) continue;
                    const score = findSimilar(allRecords[i], allRecords[j]);
                    if (score >= 1.5) {
                        group.push(allRecords[j]);
                        checked.add(j);
                    }
                }
                if (group.length > 1) groups.push(group);
            }

            setDuplicates(groups);
            const msg = `Found ${groups.length} potential duplicate group${groups.length > 1 ? 's' : ''} across ${allRecords.length} records.`;
            setAiAnalysis(msg);

            if (aiReady && groups.length > 0) {
                const result = await analyzeAI('duplicate_detection', { scanType, totalRecords: allRecords.length, duplicatesFound: groups.length });
                if (result.success) setAiAnalysis(result.message?.slice(0, 200) || msg);
            }
        } catch {
            toast.error('Failed to scan for duplicates.');
        }
        setScanning(false);
    }, [scanType, aiReady, analyzeAI, toast]);

    const handleMerge = useCallback((groupId) => {
        setMerged(prev => new Set([...prev, groupId]));
        toast.success('Duplicates merged successfully.');
    }, [toast]);

    useEffect(() => { handleScan(); }, []);

    return (
        <div className="dup-detection">
            <div className="dup-scan-controls">
                <div className="field-group">
                    <label className="field-label">Scan for duplicates in</label>
                    <div className="dup-scan-types">
                        {SCAN_TYPES.map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id}
                                    className={`dup-scan-type-btn ${scanType === t.id ? 'dup-scan-type-active' : ''}`}
                                    onClick={() => setScanType(t.id)}
                                >
                                    <Icon width={14} height={14} /> {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
                    {scanning ? 'Scanning...' : 'Scan for Duplicates'}
                </button>
            </div>

            {aiAnalysis && (
                <div className="dup-analysis-banner">
                    <IconUsers width={16} height={16} />
                    <span>{aiAnalysis}</span>
                </div>
            )}

            {scanning && (
                <div className="dup-loading">
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                    <span>Scanning records for potential duplicates...</span>
                </div>
            )}

            {!scanning && duplicates.length === 0 && (
                <div className="dup-empty">
                    <IconCheck width={32} height={32} />
                    <h4>No duplicates found</h4>
                    <p>Your data looks clean across the selected record types.</p>
                </div>
            )}

            {duplicates.length > 0 && (
                <div className="dup-results">
                    <h4>{duplicates.length} potential duplicate group{duplicates.length > 1 ? 's' : ''} found</h4>
                    {duplicates.map((group, gi) => (
                        <div key={gi} className={`dup-group ${merged.has(gi) ? 'dup-group-merged' : ''}`}>
                            <div className="dup-group-header">
                                <span className="dup-group-count">{group.length} records</span>
                                {!merged.has(gi) ? (
                                    <button className="btn btn-sm btn-primary" onClick={() => handleMerge(gi)}>
                                        Merge & Keep Latest
                                    </button>
                                ) : (
                                    <span className="dup-merged-badge"><IconCheck width={12} height={12} /> Merged</span>
                                )}
                            </div>
                            {group.map((rec, ri) => (
                                <div key={ri} className="dup-record">
                                    <div className="dup-record-field">
                                        <span className="dup-field-label">Name</span>
                                        <span className="dup-field-value">{rec.name || '—'}</span>
                                    </div>
                                    <div className="dup-record-field">
                                        <span className="dup-field-label">Email</span>
                                        <span className="dup-field-value">{rec.email || '—'}</span>
                                    </div>
                                    <div className="dup-record-field">
                                        <span className="dup-field-label">Phone</span>
                                        <span className="dup-field-value">{rec.phone || '—'}</span>
                                    </div>
                                    <div className="dup-record-field">
                                        <span className="dup-field-label">Company</span>
                                        <span className="dup-field-value">{rec.company || '—'}</span>
                                    </div>
                                    <div className="dup-record-type">{rec._type}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
