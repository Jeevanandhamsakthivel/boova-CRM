import {
    IconNodeStart, IconNodeEnd, IconNodeCondition,
    IconCheck, IconX, IconNodeWait,
    IconNodeAssignOwner, IconNodeTransferOwner,
    IconBell, IconMail, IconWhatsApp, IconNodeSms,
    IconTasks, IconEdit, IconNodeGenerateDocument,
    IconNodeWebhook, IconNodeRestApi, IconNodeAiDecision,
    IconGitMerge, IconNodeParallel,
} from "../ui/Icons";

const NODE_DEFINITIONS = [
    { type: "start", label: "Start", color: "#10B981", icon: IconNodeStart, category: "flow" },
    { type: "end", label: "End", color: "#EF4444", icon: IconNodeEnd, category: "flow" },
    { type: "condition", label: "Condition", color: "#F59E0B", icon: IconNodeCondition, category: "logic" },
    { type: "approval", label: "Approval", color: "#8B5CF6", icon: IconCheck, category: "logic" },
    { type: "reject", label: "Reject", color: "#EF4444", icon: IconX, category: "logic" },
    { type: "wait", label: "Wait/Delay", color: "#6366F1", icon: IconNodeWait, category: "logic" },
    { type: "assign_owner", label: "Assign Owner", color: "#3B82F6", icon: IconNodeAssignOwner, category: "action" },
    { type: "transfer_owner", label: "Transfer Owner", color: "#06B6D4", icon: IconNodeTransferOwner, category: "action" },
    { type: "notification", label: "Notification", color: "#F97316", icon: IconBell, category: "communication" },
    { type: "email", label: "Email", color: "#3B82F6", icon: IconMail, category: "communication" },
    { type: "whatsapp", label: "WhatsApp", color: "#25D366", icon: IconWhatsApp, category: "communication" },
    { type: "sms", label: "SMS", color: "#6366F1", icon: IconNodeSms, category: "communication" },
    { type: "create_task", label: "Create Task", color: "#14B8A6", icon: IconTasks, category: "action" },
    { type: "update_record", label: "Update Record", color: "#8B5CF6", icon: IconEdit, category: "action" },
    { type: "generate_document", label: "Generate Document", color: "#F59E0B", icon: IconNodeGenerateDocument, category: "action" },
    { type: "webhook", label: "Webhook", color: "#EC4899", icon: IconNodeWebhook, category: "integration" },
    { type: "rest_api", label: "REST API", color: "#0EA5E9", icon: IconNodeRestApi, category: "integration" },
    { type: "ai_decision", label: "AI Decision", color: "#A855F7", icon: IconNodeAiDecision, category: "ai" },
    { type: "merge", label: "Merge", color: "#10B981", icon: IconGitMerge, category: "logic" },
    { type: "parallel", label: "Parallel", color: "#6366F1", icon: IconNodeParallel, category: "logic" },
];

const CATEGORIES = [
    { key: "flow", label: "Flow Control" },
    { key: "logic", label: "Logic" },
    { key: "action", label: "Actions" },
    { key: "communication", label: "Communication" },
    { key: "integration", label: "Integrations" },
    { key: "ai", label: "AI" },
];

export function WorkflowNodePalette({ onDragStart }) {
    return (
        <div className="wf-palette">
            <div className="wf-palette-header">Nodes</div>
            {CATEGORIES.map(cat => (
                <div key={cat.key} className="wf-palette-category">
                    <div className="wf-palette-category-label">{cat.label}</div>
                    {NODE_DEFINITIONS.filter(n => n.category === cat.key).map(node => {
                        const Icon = node.icon;
                        return (
                            <div
                                key={node.type}
                                className="wf-palette-node"
                                draggable
                                onDragStart={(e) => {
                                    const { icon, ...serializable } = node;
                                    e.dataTransfer.setData("application/workflow-node", JSON.stringify(serializable));
                                    onDragStart && onDragStart(node);
                                }}
                            >
                                <span className="wf-palette-node-icon" style={{ background: node.color }}>
                                    <Icon width={14} height={14} />
                                </span>
                                <span className="wf-palette-node-label">{node.label}</span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
