/**
 * Keyboard Shortcuts Service
 * 
 * Centralized keyboard shortcut registration and management.
 * Prevents conflicts with text inputs and standard browser shortcuts.
 * 
 * Default shortcuts:
 *   ⌘K / Ctrl+K  → Command palette
 *   ⌘N / Ctrl+N  → Quick create
 *   ⌘F / Ctrl+F  → Search
 *   ⌘E / Ctrl+E  → Focus email
 *   ⌘T / Ctrl+T  → Focus tasks
 *   G then D      → Go to Dashboard
 *   G then L      → Go to Leads
 *   G then C      → Go to Customers
 *   G then P      → Go to Pipeline
 *   ?             → Show shortcuts help
 *   Esc           → Close modal / Cancel
 * 
 * Usage:
 *   import { useKeyboard } from '../../services/keyboard';
 *   useKeyboard('ctrl+k', () => openPalette());
 *   useKeyboard(['ctrl+n', 'ctrl+shift+n'], () => createNew());
 * 
 * TODO: Add custom shortcut configuration per user
 * TODO: Save custom shortcuts to user preferences
 * TODO: Add shortcut conflict detection
 * TODO: Add shortcut tournament tree for sequence shortcuts (g+d, g+l)
 */

import { useEffect, useCallback, useRef } from 'react';

let sequenceBuffer = '';
let sequenceTimeout = null;
const SEQUENCE_TIMEOUT_MS = 800;

export const KEYS = {
    COMMAND_PALETTE: { key: 'k', ctrl: true },
    QUICK_CREATE: { key: 'n', ctrl: true },
    SEARCH: { key: 'f', ctrl: true },
    FOCUS_TASKS: { key: 't', ctrl: true },
    FOCUS_EMAIL: { key: 'e', ctrl: true },
    GO_TO_DASHBOARD: { key: 'd', sequence: 'g' },
    GO_TO_LEADS: { key: 'l', sequence: 'g' },
    GO_TO_CUSTOMERS: { key: 'c', sequence: 'g' },
    GO_TO_PIPELINE: { key: 'p', sequence: 'g' },
    SHOW_HELP: { key: '?' },
    ESCAPE: { key: 'Escape' },
};

const registeredHandlers = new Map();
let isEnabled = true;

function isTextInput(element) {
    const tag = element.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable;
}

export function enableKeyboard() { isEnabled = true; }
export function disableKeyboard() { isEnabled = false; }

export function registerShortcut(shortcut, handler, description) {
    const key = typeof shortcut === 'string' ? shortcut : `${shortcut.ctrl ? 'ctrl+' : ''}${shortcut.key}`;
    registeredHandlers.set(key, { handler, description });
    return () => registeredHandlers.delete(key);
}

export function getRegisteredShortcuts() {
    return Array.from(registeredHandlers.entries()).map(([key, val]) => ({
    keys: key,
        description: val.description || 'No description',
    }));
}

export function useKeyboard(keys, handler, deps = []) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const callback = useCallback((event) => {
        if (!isEnabled) return;
        if (isTextInput(event.target) && !event.ctrlKey && !event.metaKey) return;
        handlerRef.current(event);
    }, []);

    useEffect(() => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const cleanups = keyArray.map(k => registerShortcut(k, callback));
        return () => cleanups.forEach(c => c());
    }, [keys, callback, ...deps]);
}

export function useGlobalShortcuts(shortcuts) {
    useEffect(() => {
        function handleKeyDown(event) {
            if (!isEnabled) return;
            if (isTextInput(event.target) && !event.ctrlKey && !event.metaKey && event.key !== 'Escape') return;

            const ctrl = event.ctrlKey || event.metaKey;

            if (ctrl && event.key.toLowerCase() === shortcuts.commandPalette?.key) {
                event.preventDefault();
                shortcuts.commandPalette?.handler?.();
                return;
            }

            if (ctrl && event.key.toLowerCase() === shortcuts.quickCreate?.key) {
                event.preventDefault();
                shortcuts.quickCreate?.handler?.();
                return;
            }

            if (ctrl && event.key.toLowerCase() === shortcuts.search?.key) {
                event.preventDefault();
                shortcuts.search?.handler?.();
                return;
            }

            if (!ctrl && event.key === 'Escape') {
                shortcuts.escape?.handler?.();
                return;
            }

            if (!ctrl && event.key === '?' && !event.shiftKey) {
                shortcuts.showHelp?.handler?.();
                return;
            }

            if (!ctrl && /^[a-z]$/i.test(event.key)) {
                if (sequenceBuffer.length > 0) {
                    clearTimeout(sequenceTimeout);
                    const seq = sequenceBuffer + event.key.toLowerCase();
                    sequenceBuffer = '';

                    if (seq === 'gd') shortcuts.goToDashboard?.handler?.();
                    else if (seq === 'gl') shortcuts.goToLeads?.handler?.();
                    else if (seq === 'gc') shortcuts.goToCustomers?.handler?.();
                    else if (seq === 'gp') shortcuts.goToPipeline?.handler?.();

                    return;
                }

                if (event.key.toLowerCase() === 'g') {
                    sequenceBuffer = 'g';
                    sequenceTimeout = setTimeout(() => { sequenceBuffer = ''; }, SEQUENCE_TIMEOUT_MS);
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

export default {
    useKeyboard,
    useGlobalShortcuts,
    registerShortcut,
    getRegisteredShortcuts,
    enableKeyboard,
    disableKeyboard,
    KEYS,
};
