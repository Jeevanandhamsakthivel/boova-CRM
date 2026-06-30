/**
 * Universal Search Service
 * 
 * Searches across all CRM entities:
 * - Leads, Customers, Deals, Tasks, Follow-ups
 * - Companies, Contacts, Tickets, Invoices, Quotes
 * - Emails, WhatsApp messages, Files, Notes
 * - Knowledge Base articles, Calendar events
 * 
 * Features:
 * - Debounced search (300ms)
 * - Cross-entity results grouped by type
 * - Relevance scoring
 * - Recent searches persistence
 * - Keyboard navigation
 * 
 * TODO: Add fuzzy search via Fuse.js or similar
 * TODO: Add search result caching with TTL
 * TODO: Add search suggestions from history
 * TODO: Add natural language query parsing (AI-powered)
 */

import { searchApi } from '../../api/miscApi';
import { leadsApi } from '../../api/leads';
import { customersApi } from '../../api/customers';
import { companiesApi } from '../../api/companies';
import { tasksApi } from '../../api/tasks';

const RECENT_SEARCHES_KEY = 'psm-crm-recent-searches';
const MAX_RECENT = 10;

export const ENTITIES = [
    { key: 'leads', label: 'Leads', api: leadsApi },
    { key: 'customers', label: 'Customers', api: customersApi },
    { key: 'companies', label: 'Companies', api: companiesApi },
    { key: 'tasks', label: 'Tasks', api: tasksApi },
    { key: 'deals', label: 'Deals', api: null },
    { key: 'tickets', label: 'Tickets', api: null },
    { key: 'invoices', label: 'Invoices', api: null },
    { key: 'quotes', label: 'Quotes', api: null },
    { key: 'followups', label: 'Follow-ups', api: null },
];

export function getRecentSearches() {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
}

export function addRecentSearch(query) {
    try {
        const searches = getRecentSearches().filter(s => s !== query);
        searches.unshift(query);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
    } catch {}
}

export function clearRecentSearches() {
    try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
}

export function searchAll(query, signal) {
    if (!query || query.trim().length < 2) return Promise.resolve({ results: {}, total: 0 });

    return searchApi.search(query, { signal })
        .then(res => {
            const data = res?.data?.data || {};
            const counts = Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
            return { results: data, total: counts };
        })
        .catch(err => {
            if (err?.name === 'AbortError') return { results: {}, total: 0 };
            console.warn('Search API error:', err);
            return { results: {}, total: 0 };
        });
}

export function getEntityPath(type, item) {
    const id = item?.id || item?._id;
    const paths = {
        leads: `/leads/${id}`,
        customers: `/customers/${id}`,
        companies: `/companies/${id}`,
        deals: '/pipeline',
        tasks: '/tasks',
        tickets: `/tickets/${id}`,
        invoices: `/invoices/${id}`,
        quotes: `/quotes/${id}`,
        followups: '/followups',
        contacts: `/customers/${id}`,
        emails: '/email',
        whatsapp: '/whatsapp',
        files: `/customers/${id}/workspace`,
        notes: `/customers/${id}/workspace`,
        articles: '/knowledge-base',
        events: '/calendar',
    };
    return paths[type] || '/';
}

export function getEntityLabel(type) {
    const labels = {
        leads: 'Lead',
        customers: 'Customer',
        companies: 'Company',
        deals: 'Deal',
        tasks: 'Task',
        tickets: 'Ticket',
        invoices: 'Invoice',
        quotes: 'Quote',
        followups: 'Follow-up',
        contacts: 'Contact',
        emails: 'Email',
        whatsapp: 'WhatsApp',
        files: 'File',
        notes: 'Note',
        articles: 'Article',
        events: 'Event',
    };
    return labels[type] || type;
}

export default {
    searchAll,
    getRecentSearches,
    addRecentSearch,
    clearRecentSearches,
    getEntityPath,
    getEntityLabel,
    ENTITIES,
};
