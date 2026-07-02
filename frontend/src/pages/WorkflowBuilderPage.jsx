import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { workflowsApi } from "../api/workflowsApi";
import { WorkflowCanvas } from "../components/workflow/WorkflowCanvas";
import { WorkflowNodePalette } from "../components/workflow/WorkflowNodePalette";
import { WorkflowNodeConfig } from "../components/workflow/WorkflowNodeConfig";
import { WorkflowToolbar } from "../components/workflow/WorkflowToolbar";
import WorkflowSetupWizard from "../components/workflow/WorkflowSetupWizard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import {
    IconPlus, IconSettings,
} from "../components/ui/Icons";

const EMPTY_WORKFLOW = {
    name: "",
    description: "",
    category: "automation",
    entity_type: "lead",
    status: "draft",
    nodes: [],
    edges: [],
    stages: [],
    tags: [],
    config: {},
};

function validateWorkflow(nodes, edges) {
    const errors = [];
    const hasStart = nodes.some(n => n.type === "start");
    const hasEnd = nodes.some(n => n.type === "end");
    if (!hasStart) errors.push("Workflow must have a Start node.");
    if (!hasEnd) errors.push("Workflow must have an End node.");
    if (nodes.length < 2) errors.push("Workflow must have at least 2 nodes.");
    const connected = new Set();
    edges.forEach(e => { connected.add(e.source); connected.add(e.target); });
    const orphaned = nodes.filter(n => !connected.has(n.id) && n.type !== "start");
    if (orphaned.length > 0) errors.push(`${orphaned.length} node(s) are disconnected.`);
    return errors;
}

export default function WorkflowBuilderPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const saveShortcutRef = useRef(false);

    const workflowId = searchParams.get("id");
    const [workflow, setWorkflow] = useState(EMPTY_WORKFLOW);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!workflowId);
    const [showNewModal, setShowNewModal] = useState(false);
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [showPalette, setShowPalette] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({ name: "", description: "", category: "automation", entity_type: "lead" });

    const saveRef = useRef();

    useEffect(() => {
        saveRef.current = handleSave;
    });

    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveRef.current?.();
            }
            if (e.key === "Escape") {
                setSelectedNodeId(null);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (workflowId) {
            setLoading(true);
            workflowsApi.get(workflowId)
                .then(res => {
                    const wf = res.data.data;
                    setWorkflow(wf);
                    setNodes(wf.nodes || []);
                    setEdges(wf.edges || []);
                })
                .catch(() => toast.error("Failed to load workflow"))
                .finally(() => setLoading(false));
        }
    }, [workflowId, toast]);

    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    const handleSave = useCallback(async () => {
        const validationErrors = validateWorkflow(nodes, edges);
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        setSaving(true);
        const payload = {
            ...workflow,
            nodes,
            edges,
        };
        try {
            if (workflowId) {
                const res = await workflowsApi.update(workflowId, payload);
                setWorkflow(res.data.data);
                toast.success("Workflow saved.");
            } else {
                const res = await workflowsApi.create(payload);
                setWorkflow(res.data.data);
                navigate(`/workflows/builder?id=${res.data.data.id}`, { replace: true });
                toast.success("Workflow created.");
            }
        } catch {
            toast.error("Failed to save workflow.");
        } finally {
            setSaving(false);
        }
    }, [workflow, nodes, edges, workflowId, navigate, toast]);

    const handleActivate = useCallback(async () => {
        if (!workflowId) return;
        const validationErrors = validateWorkflow(nodes, edges);
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        try {
            const res = await workflowsApi.activate(workflowId);
            setWorkflow(res.data.data);
            toast.success("Workflow activated.");
        } catch {
            toast.error("Failed to activate workflow.");
        }
    }, [workflowId, nodes, edges, toast]);

    const handleDeactivate = useCallback(async () => {
        if (!workflowId) return;
        const res = await workflowsApi.deactivate(workflowId);
        setWorkflow(res.data.data);
        toast.success("Workflow deactivated.");
    }, [workflowId, toast]);

    const handleDuplicate = useCallback(async () => {
        if (!workflowId) return;
        const res = await workflowsApi.duplicate(workflowId);
        navigate(`/workflows/builder?id=${res.data.data.id}`);
        toast.success("Workflow duplicated.");
    }, [workflowId, navigate, toast]);

    const handleDelete = useCallback(async () => {
        if (!workflowId) return;
        await workflowsApi.remove(workflowId);
        toast.success("Workflow deleted.");
        navigate("/workflows");
    }, [workflowId, navigate, toast]);

    const handleCreateNew = useCallback(async () => {
        if (!newWorkflow.name?.trim()) {
            toast.error("Name is required.");
            return;
        }
        setShowNewModal(false);
        setWorkflow({
            ...EMPTY_WORKFLOW,
            name: newWorkflow.name,
            description: newWorkflow.description,
            category: newWorkflow.category,
            entity_type: newWorkflow.entity_type,
        });
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
    }, [newWorkflow, toast]);

    const handleWizardGenerate = useCallback((result) => {
        setWorkflow({
            ...EMPTY_WORKFLOW,
            name: result.name,
            description: result.description || `Auto-generated ${result.category} workflow`,
            category: result.category,
            entity_type: result.entity_type,
            stages: [],
        });
        setNodes(result.nodes);
        setEdges(result.edges);
        setSelectedNodeId(null);
        setShowSetupWizard(false);
        toast.success(`Workflow "${result.name}" generated with ${result.nodes.length} nodes.`);
    }, [toast]);

    const handleNodeConfigChange = useCallback((nodeId, config, label) => {
        setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, config, label: label || n.label } : n
        ));
    }, []);

    if (loading) {
        return <div className="page-loading"><Spinner size={32} /></div>;
    }

    return (
        <div className="wf-builder-page">
            <div className="wf-builder-header">
                <div className="wf-builder-header-left">
                    {!workflowId ? (
                        <div className="wf-builder-title">
                            <h2>New Workflow</h2>
                        </div>
                    ) : (
                        <WorkflowToolbar
                            workflow={workflow}
                            onSave={handleSave}
                            onActivate={handleActivate}
                            onDeactivate={handleDeactivate}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onRun={() => {}}
                            saving={saving}
                        />
                    )}
                </div>
                <div className="wf-builder-header-right">
                    {!workflowId && (
                        <Button onClick={handleSave} disabled={saving || !workflow.name}>
                            {saving ? "Saving..." : "Create Workflow"}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setShowPalette(!showPalette)}>
                        {showPalette ? "Hide Palette" : "Show Palette"}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
                        <IconSettings width={14} height={14} />
                    </Button>
                </div>
            </div>

            <div className="wf-builder-body">
                {showPalette && (
                    <div className="wf-builder-palette">
                        <WorkflowNodePalette />
                    </div>
                )}

                <div className="wf-builder-canvas">
                    {!workflowId && !workflow.name && (
                        <div className="wf-builder-welcome">
                            <div className="wf-welcome-card">
                                <IconPlus width={40} height={40} />
                                <h3>Create a New Workflow</h3>
                                <p>Give your workflow a name to get started, then drag nodes from the palette.</p>
                                <div className="wf-welcome-form">
                                    <input
                                        className="field-input wf-welcome-name-input"
                                        placeholder="Workflow name..."
                                        value={newWorkflow.name}
                                        onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                                        onKeyDown={e => e.key === "Enter" && handleCreateNew()}
                                    />
                                    <Button onClick={handleCreateNew}>Create</Button>
                                    <Button variant="secondary" onClick={() => setShowSetupWizard(true)}>
                                        Setup Wizard
                                    </Button>
                                </div>
                                <div className="wf-welcome-options">
                                    <select className="field-select" value={newWorkflow.category} onChange={e => setNewWorkflow(prev => ({ ...prev, category: e.target.value }))}>
                                        <option value="automation">Automation</option>
                                        <option value="customer">Customer</option>
                                        <option value="employee">Employee</option>
                                        <option value="approval">Approval</option>
                                        <option value="department">Department</option>
                                        <option value="notification">Notification</option>
                                        <option value="assignment">Assignment</option>
                                    </select>
                                    <select className="field-select" value={newWorkflow.entity_type} onChange={e => setNewWorkflow(prev => ({ ...prev, entity_type: e.target.value }))}>
                                        <option value="lead">Lead</option>
                                        <option value="customer">Customer</option>
                                        <option value="deal">Deal</option>
                                        <option value="task">Task</option>
                                        <option value="ticket">Ticket</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {(workflow.name || workflowId) && (
                        <WorkflowCanvas
                            nodes={nodes}
                            edges={edges}
                            selectedNodeId={selectedNodeId}
                            onNodesChange={setNodes}
                            onEdgesChange={setEdges}
                            onSelectNode={(node) => {
                                setSelectedNodeId(node?.id || null);
                                setShowConfig(!!node);
                            }}
                        />
                    )}
                </div>

                {showConfig && (
                    <div className="wf-builder-config">
                        <WorkflowNodeConfig
                            node={selectedNode}
                            onChange={handleNodeConfigChange}
                            onClose={() => setShowConfig(false)}
                        />
                    </div>
                )}
            </div>

            <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New Workflow" maxWidth={500}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">Name <span className="required">*</span></label>
                        <input className="field-input" placeholder="e.g. Lead Conversion Pipeline" value={newWorkflow.name} onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Description</label>
                        <textarea className="field-input field-textarea" rows={3} value={newWorkflow.description} onChange={e => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Category</label>
                        <select className="field-select" value={newWorkflow.category} onChange={e => setNewWorkflow(prev => ({ ...prev, category: e.target.value }))}>
                            <option value="automation">Automation</option>
                            <option value="customer">Customer</option>
                            <option value="employee">Employee</option>
                            <option value="approval">Approval</option>
                            <option value="department">Department</option>
                            <option value="notification">Notification</option>
                            <option value="assignment">Assignment</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Entity Type</label>
                        <select className="field-select" value={newWorkflow.entity_type} onChange={e => setNewWorkflow(prev => ({ ...prev, entity_type: e.target.value }))}>
                            <option value="lead">Lead</option>
                            <option value="customer">Customer</option>
                            <option value="deal">Deal</option>
                            <option value="task">Task</option>
                            <option value="ticket">Ticket</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateNew}>Create</Button>
                    </div>
                </div>
            </Modal>

            {showSetupWizard && (
                <WorkflowSetupWizard
                    onGenerate={handleWizardGenerate}
                    onClose={() => setShowSetupWizard(false)}
                />
            )}
        </div>
    );
}
