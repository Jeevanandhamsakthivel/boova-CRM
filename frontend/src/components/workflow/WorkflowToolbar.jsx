import { Button } from "../ui/Button";
import { IconSave, IconPlay, IconCopy, IconTrash } from "../ui/Icons";

export function WorkflowToolbar({
    workflow,
    onSave,
    onActivate,
    onDeactivate,
    onDuplicate,
    onDelete,
    onRun,
    running,
    saving,
}) {
    if (!workflow) return null;

    return (
        <div className="wf-toolbar">
            <div className="wf-toolbar-info">
                <span className="wf-toolbar-name">{workflow.name}</span>
                <span className={`wf-toolbar-status wf-toolbar-status-${workflow.status}`}>
                    {workflow.status}
                </span>
                <span className="wf-toolbar-meta">v{workflow.version || 1}</span>
            </div>
            <div className="wf-toolbar-actions">
                <Button onClick={onSave} disabled={saving}>
                    <IconSave width={14} height={14} /> {saving ? "Saving..." : "Save"}
                </Button>
                {workflow.status === "active" ? (
                    <>
                        <Button variant="success" onClick={onRun} disabled={running}>
                            <IconPlay width={14} height={14} /> {running ? "Running..." : "Run"}
                        </Button>
                        <Button variant="secondary" onClick={onDeactivate}>
                            Deactivate
                        </Button>
                    </>
                ) : workflow.status === "draft" || workflow.status === "inactive" ? (
                    <Button variant="success" onClick={onActivate}>
                        <IconPlay width={14} height={14} /> Activate
                    </Button>
                ) : null}
                <Button variant="secondary" onClick={onDuplicate}>
                    <IconCopy width={14} height={14} /> Duplicate
                </Button>
                {workflow.status !== "active" && (
                    <Button variant="danger" onClick={onDelete}>
                        <IconTrash width={14} height={14} /> Delete
                    </Button>
                )}
            </div>
        </div>
    );
}
