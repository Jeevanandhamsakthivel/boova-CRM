/**
 * Workflow Engine — Trigger → Condition → Action pipeline
 * 
 * Architecture:
 *   Trigger (event) → Condition (predicate) → Action (side effect)
 * 
 * Built-in triggers:
 *   - lead.created, lead.updated, lead.converted
 *   - deal.created, deal.updated, deal.won, deal.lost
 *   - customer.created, customer.updated
 *   - task.created, task.completed, task.overdue
 *   - ticket.created, ticket.resolved
 *   - followup.due, followup.overdue
 *   - invoice.created, invoice.paid, invoice.overdue
 * 
 * Built-in actions:
 *   - assign_user, send_email, create_task, notify_user
 *   - update_field, webhook, slack_notify
 * 
 * TODO: Connect to real automation API backend
 * TODO: Add drag-and-drop workflow builder UI
 * TODO: Add condition builder with AND/OR groups
 * TODO: Add workflow testing/debugging mode
 * TODO: Add workflow version history
 * TODO: Add rate limiting and execution logs
 */

export const TRIGGER_TYPES = {
    LEAD_CREATED: 'lead.created',
    LEAD_UPDATED: 'lead.updated',
    LEAD_CONVERTED: 'lead.converted',
    DEAL_CREATED: 'deal.created',
    DEAL_UPDATED: 'deal.updated',
    DEAL_WON: 'deal.won',
    DEAL_LOST: 'deal.lost',
    CUSTOMER_CREATED: 'customer.created',
    CUSTOMER_UPDATED: 'customer.updated',
    TASK_CREATED: 'task.created',
    TASK_COMPLETED: 'task.completed',
    TASK_OVERDUE: 'task.overdue',
    TICKET_CREATED: 'ticket.created',
    TICKET_RESOLVED: 'ticket.resolved',
    FOLLOWUP_DUE: 'followup.due',
    FOLLOWUP_OVERDUE: 'followup.overdue',
    INVOICE_CREATED: 'invoice.created',
    INVOICE_PAID: 'invoice.paid',
    INVOICE_OVERDUE: 'invoice.overdue',
};

export const ACTION_TYPES = {
    ASSIGN_USER: 'assign_user',
    SEND_EMAIL: 'send_email',
    CREATE_TASK: 'create_task',
    NOTIFY_USER: 'notify_user',
    UPDATE_FIELD: 'update_field',
    WEBHOOK: 'webhook',
    SLACK_NOTIFY: 'slack_notify',
    SEND_WHATSAPP: 'send_whatsapp',
    CREATE_FOLLOWUP: 'create_followup',
};

export const TRIGGER_LABELS = {
    [TRIGGER_TYPES.LEAD_CREATED]: 'Lead Created',
    [TRIGGER_TYPES.LEAD_UPDATED]: 'Lead Updated',
    [TRIGGER_TYPES.LEAD_CONVERTED]: 'Lead Converted to Deal',
    [TRIGGER_TYPES.DEAL_CREATED]: 'Deal Created',
    [TRIGGER_TYPES.DEAL_UPDATED]: 'Deal Updated',
    [TRIGGER_TYPES.DEAL_WON]: 'Deal Won',
    [TRIGGER_TYPES.DEAL_LOST]: 'Deal Lost',
    [TRIGGER_TYPES.CUSTOMER_CREATED]: 'Customer Created',
    [TRIGGER_TYPES.CUSTOMER_UPDATED]: 'Customer Updated',
    [TRIGGER_TYPES.TASK_CREATED]: 'Task Created',
    [TRIGGER_TYPES.TASK_COMPLETED]: 'Task Completed',
    [TRIGGER_TYPES.TASK_OVERDUE]: 'Task Overdue',
    [TRIGGER_TYPES.TICKET_CREATED]: 'Ticket Created',
    [TRIGGER_TYPES.TICKET_RESOLVED]: 'Ticket Resolved',
    [TRIGGER_TYPES.FOLLOWUP_DUE]: 'Follow-up Due',
    [TRIGGER_TYPES.FOLLOWUP_OVERDUE]: 'Follow-up Overdue',
    [TRIGGER_TYPES.INVOICE_CREATED]: 'Invoice Created',
    [TRIGGER_TYPES.INVOICE_PAID]: 'Invoice Paid',
    [TRIGGER_TYPES.INVOICE_OVERDUE]: 'Invoice Overdue',
};

export const ACTION_LABELS = {
    [ACTION_TYPES.ASSIGN_USER]: 'Assign User',
    [ACTION_TYPES.SEND_EMAIL]: 'Send Email',
    [ACTION_TYPES.CREATE_TASK]: 'Create Task',
    [ACTION_TYPES.NOTIFY_USER]: 'Notify User',
    [ACTION_TYPES.UPDATE_FIELD]: 'Update Field',
    [ACTION_TYPES.WEBHOOK]: 'Webhook',
    [ACTION_TYPES.SLACK_NOTIFY]: 'Slack Notification',
    [ACTION_TYPES.SEND_WHATSAPP]: 'Send WhatsApp',
    [ACTION_TYPES.CREATE_FOLLOWUP]: 'Create Follow-up',
};

export const CONDITION_OPERATORS = {
    EQUALS: 'eq',
    NOT_EQUALS: 'neq',
    CONTAINS: 'contains',
    GREATER_THAN: 'gt',
    LESS_THAN: 'lt',
    IS_EMPTY: 'is_empty',
    IS_NOT_EMPTY: 'is_not_empty',
    IN: 'in',
    NOT_IN: 'not_in',
};

export function createWorkflow(config) {
    if (!config || !config.trigger) {
        throw new Error('Workflow must have a trigger');
    }
    return {
        id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: config.name || 'Untitled Workflow',
        description: config.description || '',
        trigger: config.trigger,
        conditions: config.conditions || [],
        actions: config.actions || [],
        enabled: config.enabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
        lastExecutedAt: null,
    };
}

export function evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(condition => {
        const actualValue = context[condition.field];
        switch (condition.operator) {
            case CONDITION_OPERATORS.EQUALS: return actualValue === condition.value;
            case CONDITION_OPERATORS.NOT_EQUALS: return actualValue !== condition.value;
            case CONDITION_OPERATORS.CONTAINS: return String(actualValue).includes(String(condition.value));
            case CONDITION_OPERATORS.GREATER_THAN: return Number(actualValue) > Number(condition.value);
            case CONDITION_OPERATORS.LESS_THAN: return Number(actualValue) < Number(condition.value);
            case CONDITION_OPERATORS.IS_EMPTY: return !actualValue;
            case CONDITION_OPERATORS.IS_NOT_EMPTY: return !!actualValue;
            case CONDITION_OPERATORS.IN: return Array.isArray(condition.value) && condition.value.includes(actualValue);
            case CONDITION_OPERATORS.NOT_IN: return Array.isArray(condition.value) && !condition.value.includes(actualValue);
            default: return true;
        }
    });
}

export function executeActions(actions, context) {
    const results = actions.map(action => {
        console.log(`[Workflow] Executing action: ${action.type}`, { action, context });
        return {
            type: action.type,
            status: 'simulated',
            message: `Action "${ACTION_LABELS[action.type] || action.type}" executed (simulated)`,
            timestamp: new Date().toISOString(),
        };
    });
    return Promise.resolve(results);
}

export async function executeWorkflow(workflow, context) {
    if (!workflow.enabled) {
        return { executed: false, reason: 'Workflow is disabled' };
    }

    const conditionsMet = evaluateConditions(workflow.conditions, context);
    if (!conditionsMet) {
        return { executed: false, reason: 'Conditions not met' };
    }

    const actionResults = await executeActions(workflow.actions, context);

    return {
        executed: true,
        workflowId: workflow.id,
        workflowName: workflow.name,
        trigger: workflow.trigger,
        actionResults,
        timestamp: new Date().toISOString(),
    };
}

export default {
    createWorkflow,
    evaluateConditions,
    executeActions,
    executeWorkflow,
    TRIGGER_TYPES,
    ACTION_TYPES,
    CONDITION_OPERATORS,
    TRIGGER_LABELS,
    ACTION_LABELS,
};
