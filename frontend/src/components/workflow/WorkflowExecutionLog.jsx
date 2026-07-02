import { StatusBadge } from "../ui/Badge";
import { formatDateTime } from "../../utils/formatters";

const STATUS_ICONS = {
    pending: "⏳",
    running: "▶",
    completed: "✓",
    failed: "✕",
    cancelled: "⊘",
    skipped: "→",
};

export function WorkflowExecutionLog({ execution }) {
    if (!execution) {
        return (
            <div className="wf-exec-log-empty">
                Select an execution to view its log
            </div>
            );
    }

    const { node_logs: nodeLogs = [], status, started_at, completed_at, error } = execution;

    return (
        <div className="wf-exec-log">
            <div className="wf-exec-log-header">
                <div className="wf-exec-log-status">
                    <StatusBadge status={status} />
                </div>
                <div className="wf-exec-log-times">
                    {started_at && <span>Started: {formatDateTime(started_at)}</span>}
                    {completed_at && <span>Completed: {formatDateTime(completed_at)}</span>}
                </div>
            </div>

            {error && (
                <div className="wf-exec-log-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="wf-exec-log-nodes">
                <h4>Node Execution Log ({nodeLogs.length} nodes)</h4>
                {nodeLogs.length === 0 ? (
                    <div className="empty-state" style={{ padding: 16 }}>
                        <p>No node logs yet</p>
                    </div>
                ) : (
                    <div className="wf-exec-log-list">
                        {nodeLogs.map((log, i) => (
                            <div key={i} className={`wf-exec-log-item wf-exec-log-item-${log.status}`}>
                                <div className="wf-exec-log-item-icon">
                                    {STATUS_ICONS[log.status] || "●"}
                                </div>
                                <div className="wf-exec-log-item-body">
                                    <div className="wf-exec-log-item-header">
                                        <strong>{log.node_type?.replace(/_/g, " ")}</strong>
                                        <StatusBadge status={log.status} />
                                    </div>
                                    <div className="wf-exec-log-item-meta">
                                        {log.started_at && <span>{formatDateTime(log.started_at)}</span>}
                                        {log.duration_ms != null && <span>{log.duration_ms}ms</span>}
                                    </div>
                                    {log.error && <div className="wf-exec-log-item-error">{log.error}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
