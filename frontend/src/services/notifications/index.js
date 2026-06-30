/**
 * Smart Notification Service
 * 
 * Features:
 * - Priority-based notification sorting
 * - Smart daily summary generation
 * - Notification deduplication
 * - Category-based grouping
 * - Read/unread tracking
 * - Persistent storage
 * 
 * Priority levels:
 *   urgent    → immediate attention (overdue tasks, deal at risk)
 *   important → needs review (new lead, meeting reminder)
 *   normal    → informational (task completed, email received)
 *   low       → FYI (system updates, weekly summary)
 * 
 * TODO: Connect to WebSocket for real-time notifications
 * TODO: Add push notification support (Web Push API)
 * TODO: Add email digest configuration
 * TODO: Add notification preference per user
 * TODO: Add snooze functionality
 * TODO: Add notification grouping by entity
 */

import { notificationsApi } from '../../api/miscApi';

export const PRIORITY = {
    URGENT: 'urgent',
    IMPORTANT: 'important',
    NORMAL: 'normal',
    LOW: 'low',
};

export const CATEGORY = {
    TASK: 'task',
    LEAD: 'lead',
    DEAL: 'deal',
    FOLLOWUP: 'followup',
    MEETING: 'meeting',
    INVOICE: 'invoice',
    TICKET: 'ticket',
    SYSTEM: 'system',
    APPROVAL: 'approval',
    MENTION: 'mention',
};

const PRIORITY_ORDER = { urgent: 0, important: 1, normal: 2, low: 3 };

export function getPriorityLabel(priority) {
    const labels = { urgent: 'Urgent', important: 'Important', normal: 'Normal', low: 'Low' };
    return labels[priority] || priority;
}

export function getCategoryLabel(category) {
    const labels = {
        task: 'Task', lead: 'Lead', deal: 'Deal', followup: 'Follow-up',
        meeting: 'Meeting', invoice: 'Invoice', ticket: 'Ticket',
        system: 'System', approval: 'Approval', mention: 'Mention',
    };
    return labels[category] || category;
}

export function sortByPriority(notifications) {
    return [...notifications].sort((a, b) => {
        const aPrio = PRIORITY_ORDER[a.priority] ?? 2;
        const bPrio = PRIORITY_ORDER[b.priority] ?? 2;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
    });
}

export function groupByCategory(notifications) {
    return notifications.reduce((groups, n) => {
        const cat = n.category || CATEGORY.SYSTEM;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(n);
        return groups;
    }, {});
}

export function generateDailySummary(notifications) {
    const grouped = groupByCategory(notifications);
    const priorityCounts = { urgent: 0, important: 0, normal: 0, low: 0 };
    notifications.forEach(n => {
        if (priorityCounts[n.priority] !== undefined) priorityCounts[n.priority]++;
    });

    const lines = [];
    if (priorityCounts.urgent > 0) lines.push(`🔴 ${priorityCounts.urgent} urgent items need your attention`);
    if (priorityCounts.important > 0) lines.push(`🟡 ${priorityCounts.important} important items to review`);
    if (priorityCounts.normal > 0) lines.push(`🔵 ${priorityCounts.normal} updates`);
    if (priorityCounts.low > 0) lines.push(`⚪ ${priorityCounts.low} FYI items`);

    Object.entries(grouped).forEach(([cat, items]) => {
        const unread = items.filter(n => !n.read).length;
        if (unread > 0) lines.push(`• ${unread} unread in ${getCategoryLabel(cat)}`);
    });

    return {
        summary: lines.join('\n'),
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        priorityCounts,
        generatedAt: new Date().toISOString(),
    };
}

export async function fetchNotifications(params = {}) {
    try {
        const res = await notificationsApi.list(params);
        const items = res?.data?.data || [];
        return {
            items: sortByPriority(items),
            meta: res?.data?.meta || {},
        };
    } catch (err) {
        console.warn('Failed to fetch notifications:', err);
        return { items: [], meta: {} };
    }
}

export async function markAsRead(id) {
    try {
        await notificationsApi.markRead(id);
        return true;
    } catch { return false; }
}

export async function markAllAsRead() {
    try {
        await notificationsApi.markAllRead();
        return true;
    } catch { return false; }
}

export default {
    sortByPriority,
    groupByCategory,
    generateDailySummary,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    PRIORITY,
    CATEGORY,
    getPriorityLabel,
    getCategoryLabel,
};
