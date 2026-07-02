import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../context/AIContext';
import { IconBot } from '../ui/Icons';

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
    const { ready: aiReady, askAI } = useAI();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const debounceRef = useRef(null);

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setAiSuggestion(null);
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

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (aiReady && q.length > 5 && matched.length === 0) {
            debounceRef.current = setTimeout(async () => {
                const result = await askAI(
                    'CRM navigation assistant',
                    `The user is searching for: "${query}". Suggest which CRM page they should navigate to. Options: leads, customers, pipeline, tasks, followups, calendar, email, whatsapp, tickets, reports, quotes, invoices, products, projects, settings, users. Respond with just the page name and a brief reason.`
                );
                if (result.success) {
                    setAiSuggestion(result.message.slice(0, 120));
                }
            }, 600);
        }

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, aiReady, askAI]);

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
            <div className="nls-overlay" onClick={onClose} />
            <div className="nls-panel">
                <div className="nls-input-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width={18} height={18} className="nls-input-icon">
                        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4zM4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask in plain English... (e.g., 'Show me leads from last week')"
                        className="nls-input"
                    />
                    <kbd className="nls-kbd">Esc</kbd>
                </div>

                {results.length > 0 && (
                    <div className="nls-results">
                        <div className="nls-results-label">Navigate to</div>
                        {results.map((r, i) => (
                            <button
                                key={r.path}
                                onClick={() => handleSelect(r.path)}
                                className={`nls-result-item ${i === 0 ? 'nls-result-highlighted' : ''}`}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16} className="nls-result-arrow">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                <span className="nls-result-label">{r.label}</span>
                                <span className="nls-result-path">{r.path}</span>
                                {i === 0 && <kbd className="nls-kbd">↵</kbd>}
                            </button>
                        ))}
                    </div>
                )}

                {query.trim() && results.length === 0 && (
                    <div className="nls-empty">
                        <p>No matching modules found for "{query}"</p>
                        {aiSuggestion ? (
                            <div className="nls-ai-suggestion">
                                <IconBot width={16} height={16} />
                                {aiSuggestion}
                            </div>
                        ) : (
                            <p className="nls-empty-hint">Try: leads, tasks, pipeline, customers, or reports</p>
                        )}
                    </div>
                )}

                <div className="nls-footer">
                    <span><kbd className="nls-kbd-inline">↑↓</kbd> Navigate</span>
                    <span><kbd className="nls-kbd-inline">↵</kbd> Open</span>
                    <span><kbd className="nls-kbd-inline">Esc</kbd> Close</span>
                </div>
            </div>
        </>
    );
}
