/**
 * Natural Language Search — Allows users to search using plain English
 * 
 * Examples:
 *   "Show me all leads from last week"
 *   "Find customers in New York with pending follow-ups"
 *   "What deals are closing this month?"
 *   "Show tasks assigned to John that are overdue"
 * 
 * Currently uses keyword matching. When connected to an AI provider,
 * it will use NLP to parse complex queries.
 * 
 * TODO: Connect to AI provider for NLP query parsing
 * TODO: Add query suggestions based on user behavior
 * TODO: Add voice input support (Web Speech API)
 * TODO: Add query history and saved searches
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const patterns = [
    { match: /lead|prospect/i, path: '/leads', label: 'Leads' },
    { match: /customer|client|contact/i, path: '/customers', label: 'Customers' },
    { match: /deal|pipeline|opportunity/i, path: '/pipeline', label: 'Pipeline' },
    { match: /task|todo/i, path: '/tasks', label: 'Tasks' },
    { match: /follow.?up/i, path: '/followups', label: 'Follow-ups' },
    { match: /meeting|calendar|schedule/i, path: '/calendar', label: 'Calendar' },
    { match: /invoice|bill/i, path: '/invoices', label: 'Invoices' },
    { match: /quote|quotation/i, path: '/quotes', label: 'Quotes' },
    { match: /ticket|support/i, path: '/tickets', label: 'Tickets' },
    { match: /report|analytics/i, path: '/reports', label: 'Reports' },
    { match: /product/i, path: '/products', label: 'Products' },
    { match: /service/i, path: '/services', label: 'Services' },
    { match: /project/i, path: '/projects', label: 'Projects' },
    { match: /document|file/i, path: '/documents', label: 'Documents' },
    { match: /user|team|employee/i, path: '/users', label: 'Users' },
    { match: /setting|preference/i, path: '/settings', label: 'Settings' },
    { match: /email|mail/i, path: '/email', label: 'Email' },
    { match: /whatsapp|message/i, path: '/whatsapp', label: 'WhatsApp' },
];

export default function NaturalLanguageSearch({ onClose, open }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const q = query.toLowerCase();
        const matched = patterns
            .filter(p => p.match.test(q))
            .map(p => ({
                ...p,
                score: (q.match(p.match) || [''])[0].length,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        setResults(matched);
    }, [query]);

    const handleSelect = useCallback((path) => {
        navigate(path);
        setQuery('');
        setResults([]);
        onClose?.();
    }, [navigate, onClose]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && results.length > 0) {
            handleSelect(results[0].path);
        }
        if (e.key === 'Escape') {
            onClose?.();
        }
    }, [results, handleSelect, onClose]);

    if (!open) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 199 }} onClick={onClose} />
            <div style={{
                position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
                width: '90%', maxWidth: 520, zIndex: 200, overflow: 'hidden',
            }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width={18} height={18} style={{ flex: 'none' }}>
                        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4zM4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask in plain English... (e.g., 'Show me leads from last week')"
                        style={{
                            flex: 1, border: 'none', outline: 'none', fontSize: 15,
                            background: 'transparent', color: 'var(--ink-800)',
                            fontFamily: 'var(--font-body)',
                        }}
                    />
                    <kbd style={{
                        fontSize: 10, padding: '2px 6px', background: 'var(--ink-200)',
                        borderRadius: 3, color: 'var(--ink-500)', fontWeight: 700,
                    }}>
                        Esc
                    </kbd>
                </div>

                {results.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 8, maxHeight: 280, overflowY: 'auto' }}>
                        <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-400)' }}>
                            Navigate to
                        </div>
                        {results.map((r, i) => (
                            <button
                                key={r.path}
                                onClick={() => handleSelect(r.path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                    border: 'none', background: i === 0 ? 'var(--accent-tint)' : 'transparent',
                                    cursor: 'pointer', fontSize: 13, color: 'var(--ink-700)',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16} style={{ color: 'var(--ink-400)' }}>
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                <span style={{ fontWeight: 600 }}>{r.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-400)' }}>{r.path}</span>
                                {i === 0 && <kbd style={{ fontSize: 10, padding: '1px 5px', background: 'var(--ink-200)', borderRadius: 3, color: 'var(--ink-500)' }}>↵</kbd>}
                            </button>
                        ))}
                    </div>
                )}

                {query.trim() && results.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                        <p>No matching modules found for "{query}"</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Try: leads, tasks, pipeline, customers, or reports</p>
                    </div>
                )}

                <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-400)', display: 'flex', gap: 16 }}>
                    <span><kbd style={kbdStyle}>↑↓</kbd> Navigate</span>
                    <span><kbd style={kbdStyle}>↵</kbd> Open</span>
                    <span><kbd style={kbdStyle}>Esc</kbd> Close</span>
                </div>
            </div>
        </>
    );
}

const kbdStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '1px 5px', fontSize: 10, fontWeight: 700,
    background: 'var(--ink-200)', borderRadius: 3,
    marginRight: 4, color: 'var(--ink-600)',
};
