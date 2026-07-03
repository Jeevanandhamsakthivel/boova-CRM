import { memo, useCallback } from "react";
import {
    IconNodeStart, IconNodeEnd, IconNodeCondition,
    IconCheck, IconX, IconNodeWait,
    IconNodeAssignOwner, IconNodeTransferOwner,
    IconBell, IconMail, IconWhatsApp, IconNodeSms,
    IconTasks, IconEdit, IconNodeGenerateDocument,
    IconNodeWebhook, IconNodeRestApi, IconNodeAiDecision,
    IconGitMerge, IconNodeParallel,
} from "../ui/Icons";

const NODE_ICONS = {
    start: IconNodeStart,
    end: IconNodeEnd,
    condition: IconNodeCondition,
    approval: IconCheck,
    reject: IconX,
    wait: IconNodeWait,
    assign_owner: IconNodeAssignOwner,
    transfer_owner: IconNodeTransferOwner,
    notification: IconBell,
    email: IconMail,
    whatsapp: IconWhatsApp,
    sms: IconNodeSms,
    create_task: IconTasks,
    update_record: IconEdit,
    generate_document: IconNodeGenerateDocument,
    webhook: IconNodeWebhook,
    rest_api: IconNodeRestApi,
    ai_decision: IconNodeAiDecision,
    merge: IconGitMerge,
    parallel: IconNodeParallel,
};

const NODE_COLORS = {
    start: "#10B981",
    end: "#EF4444",
    condition: "#F59E0B",
    approval: "#8B5CF6",
    reject: "#EF4444",
    wait: "#6366F1",
    assign_owner: "#3B82F6",
    transfer_owner: "#06B6D4",
    notification: "#F97316",
    email: "#3B82F6",
    whatsapp: "#25D366",
    sms: "#6366F1",
    create_task: "#14B8A6",
    update_record: "#8B5CF6",
    generate_document: "#F59E0B",
    webhook: "#EC4899",
    rest_api: "#0EA5E9",
    ai_decision: "#A855F7",
    merge: "#10B981",
    parallel: "#6366F1",
};

function WorkflowNodeInner({ node, selected, dragging, onSelect, onDelete, onDragStart, onOutputClick }) {
    const color = NODE_COLORS[node.type] || "#6366F1";
    const Icon = NODE_ICONS[node.type] || IconNodeStart;

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        if (e.target.closest(".wf-node-delete")) return;
        if (e.target.closest(".wf-node-handle")) return;
        onDragStart(e, node.id);
    }, [node.id, onDragStart]);

    const handleOutputClick = useCallback((e) => {
        e.stopPropagation();
        onOutputClick(e, node.id);
    }, [node.id, onOutputClick]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete(node.id);
    }, [node.id, onDelete]);

    const handleSelect = useCallback((e) => {
        e.stopPropagation();
        onSelect(node);
    }, [node, onSelect]);

    const classNames = [
        "wf-node",
        selected && "wf-node-selected",
        dragging && "wf-node-dragging",
    ].filter(Boolean).join(" ");

    return (
        <div
            className={classNames}
            style={{ position: "absolute", left: node.position.x, top: node.position.y }}
            onClick={handleSelect}
            onMouseDown={handleMouseDown}
        >
            <div className="wf-node-header" style={{ background: color }}>
                <span className="wf-node-icon"><Icon width={14} height={14} /></span>
                <span className="wf-node-label">{node.label || node.type.replace(/_/g, " ")}</span>
                <button className="wf-node-delete" onClick={handleDelete}>×</button>
            </div>
            <div className="wf-node-body">
                <span className="wf-node-type">{node.type.replace(/_/g, " ")}</span>
            </div>
            <div className="wf-node-handle wf-node-handle-input" title="Input" />
            <div className="wf-node-handle wf-node-handle-output" title="Drag to connect" onClick={handleOutputClick} />
        </div>
    );
}

export const WorkflowNode = memo(WorkflowNodeInner);
