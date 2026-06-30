import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const actions = [
    { label: 'New Lead', icon: '+', to: '/leads', shortcut: 'N', color: 'var(--accent)' },
    { label: 'New Task', icon: '☐', to: '/tasks', shortcut: 'T', color: 'var(--accent-blue)' },
    { label: 'New Follow-up', icon: '↻', to: '/followups', shortcut: 'F', color: 'var(--accent-amber)' },
    { label: 'New Customer', icon: '👤', to: '/customers', shortcut: 'C', color: 'var(--accent-green)' },
    { label: 'New Quote', icon: '💰', to: '/quotes', shortcut: 'Q', color: 'var(--accent-purple)' },
];

export default function FloatingActionButton({ onQuickCreate }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className="fab-actions">
                    {actions.map(action => (
                        <button
                            key={action.label}
                            onClick={() => {
                                setOpen(false);
                                if (onQuickCreate) onQuickCreate(action);
                                else navigate(action.to);
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 16px 8px 12px',
                                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-lg)',
                                cursor: 'pointer', color: 'var(--ink-700)',
                                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                                animation: 'fade-in-up 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--ink-700)'; }}
                        >
                            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{action.icon}</span>
                            <span>{action.label}</span>
                            <kbd style={{
                                marginLeft: 8, fontSize: 10, padding: '1px 6px',
                                background: 'var(--ink-200)', borderRadius: 3,
                                color: 'var(--ink-500)', fontWeight: 700,
                            }}>
                                N
                            </kbd>
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={() => setOpen(!open)}
                aria-label="Quick actions"
                style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    border: 'none', color: '#fff', fontSize: 24,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(109, 40, 217, 0.35)',
                    transition: 'all 0.2s',
                    transform: open ? 'rotate(45deg)' : 'rotate(0)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(109, 40, 217, 0.45)'; e.currentTarget.style.transform = `scale(1.05) ${open ? 'rotate(45deg)' : 'rotate(0)'}`; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(109, 40, 217, 0.35)'; e.currentTarget.style.transform = open ? 'rotate(45deg)' : 'rotate(0)'; }}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={22} height={22}>
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </div>
    );
}
