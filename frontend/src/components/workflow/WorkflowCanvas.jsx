import { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowNode } from "./WorkflowNode";

let nodeIdCounter = 100;

function generateNodeId() {
    return `n${++nodeIdCounter}`;
}

function generateEdgeId() {
    return `e${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function getGridPoint(e, canvasRect, offset, zoom) {
    return {
        x: (e.clientX - canvasRect.left) / zoom + offset.x,
        y: (e.clientY - canvasRect.top) / zoom + offset.y,
    };
}

function gridToScreen(gridX, gridY, canvasRect, offset, zoom) {
    return {
        x: (gridX - offset.x) * zoom + canvasRect.left,
        y: (gridY - offset.y) * zoom + canvasRect.top,
    };
}

function getEdgePath(src, tgt) {
    const sx = src.position.x + 120;
    const sy = src.position.y + 35;
    const tx = tgt.position.x;
    const ty = tgt.position.y + 35;
    const dx = Math.abs(tx - sx);
    const mx = sx + Math.max(dx * 0.5, 60);
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;

export function WorkflowCanvas({ nodes, edges, selectedNodeId, onNodesChange, onEdgesChange, onSelectNode, readOnly }) {
    const canvasRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [connecting, setConnecting] = useState(null);
    const [mouseGrid, setMouseGrid] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(null);
    const nodePositionsRef = useRef({});

    useEffect(() => {
        const map = {};
        nodes.forEach(n => { map[n.id] = { ...n.position }; });
        nodePositionsRef.current = map;
    }, [nodes]);

    const getCanvasRect = useCallback(() => {
        return canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    }, []);

    const handleCanvasDrop = useCallback((e) => {
        e.preventDefault();
        if (readOnly) return;
        const raw = e.dataTransfer.getData("application/workflow-node");
        if (!raw) return;
        const nodeData = JSON.parse(raw);
        const rect = getCanvasRect();
        const pt = getGridPoint(e, rect, canvasOffset, zoom);
        const x = pt.x - 60;
        const y = pt.y - 20;

        const newNode = {
            id: generateNodeId(),
            type: nodeData.type,
            label: nodeData.label,
            position: { x: Math.max(0, x), y: Math.max(0, y) },
            config: {},
        };
        onNodesChange([...nodes, newNode]);
    }, [nodes, onNodesChange, canvasOffset, zoom, readOnly, getCanvasRect]);

    const handleNodeDragStart = useCallback((e, nodeId) => {
        if (readOnly) return;
        e.stopPropagation();
        const nodeEl = e.target.closest("[data-node-id]");
        if (!nodeEl) return;
        const rect = getCanvasRect();
        const pt = getGridPoint(e, rect, canvasOffset, zoom);
        setDragging(nodeId);
        setDragOffset({
            x: pt.x - (nodePositionsRef.current[nodeId]?.x || 0),
            y: pt.y - (nodePositionsRef.current[nodeId]?.y || 0),
        });
    }, [canvasOffset, zoom, readOnly, getCanvasRect]);

    const handleCanvasMouseMove = useCallback((e) => {
        const rect = getCanvasRect();
        const pt = getGridPoint(e, rect, canvasOffset, zoom);

        if (panning) {
            setCanvasOffset({
                x: panning.initialOffset.x - (e.clientX - panning.startX) / zoom,
                y: panning.initialOffset.y - (e.clientY - panning.startY) / zoom,
            });
            return;
        }

        if (dragging) {
            const x = Math.max(0, pt.x - dragOffset.x);
            const y = Math.max(0, pt.y - dragOffset.y);
            const updated = nodes.map(n =>
                n.id === dragging ? { ...n, position: { x, y } } : n
            );
            onNodesChange(updated);
            return;
        }

        if (connecting) {
            setMouseGrid(pt);
        }
    }, [dragging, dragOffset, nodes, onNodesChange, connecting, canvasOffset, zoom, panning, getCanvasRect]);

    const handleCanvasMouseUp = useCallback(() => {
        if (panning) {
            setPanning(null);
            return;
        }
        if (connecting) {
            const rect = getCanvasRect();
            const screenPt = gridToScreen(mouseGrid.x, mouseGrid.y, rect, canvasOffset, zoom);
            const targetEl = document.elementFromPoint(screenPt.x, screenPt.y);
            if (targetEl) {
                const nodeEl = targetEl.closest("[data-node-id]");
                if (nodeEl) {
                    const targetId = nodeEl.getAttribute("data-node-id");
                    if (targetId && targetId !== connecting.sourceId) {
                        const exists = edges.some(e => e.source === connecting.sourceId && e.target === targetId);
                        if (!exists) {
                            const newEdge = {
                                id: generateEdgeId(),
                                source: connecting.sourceId,
                                target: targetId,
                            };
                            onEdgesChange([...edges, newEdge]);
                        }
                    }
                }
            }
        }
        setDragging(null);
        setConnecting(null);
    }, [connecting, edges, onEdgesChange, canvasOffset, zoom, mouseGrid, getCanvasRect]);

    const handleNodeDelete = useCallback((nodeId) => {
        if (readOnly) return;
        const updatedNodes = nodes.filter(n => n.id !== nodeId);
        const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        onNodesChange(updatedNodes);
        onEdgesChange(updatedEdges);
        if (selectedNodeId === nodeId) onSelectNode(null);
    }, [nodes, edges, selectedNodeId, onNodesChange, onEdgesChange, onSelectNode, readOnly]);

    const handleCanvasClick = useCallback((e) => {
        if (e.target.closest("[data-node-id]")) return;
        if (e.target.closest(".wf-node")) return;
        onSelectNode(null);
    }, [onSelectNode]);

    const handleCanvasDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleNodeOutputClick = useCallback((e, nodeId) => {
        if (readOnly) return;
        e.stopPropagation();
        const rect = getCanvasRect();
        const pt = getGridPoint(e, rect, canvasOffset, zoom);
        setConnecting({ sourceId: nodeId });
        setMouseGrid(pt);
    }, [readOnly, canvasOffset, zoom, getCanvasRect]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const delta = -e.deltaY * 0.001;
            setZoom(prev => {
                const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
                return Math.round(next * 10) / 10;
            });
        } else {
            setCanvasOffset(prev => ({
                x: Math.max(0, prev.x + e.deltaX / zoom),
                y: Math.max(0, prev.y + e.deltaY / zoom),
            }));
        }
    }, [zoom]);

    const handleCanvasMouseDown = useCallback((e) => {
        if (e.target === canvasRef.current || e.target.classList.contains("wf-canvas-grid") || e.target.classList.contains("wf-edges-svg")) {
            setPanning({
                startX: e.clientX,
                startY: e.clientY,
                initialOffset: { ...canvasOffset },
            });
        }
    }, [canvasOffset, getCanvasRect]);

    useEffect(() => {
        const el = canvasRef.current;
        if (el) {
            el.addEventListener("wheel", handleWheel, { passive: false });
        }
        return () => {
            if (el) el.removeEventListener("wheel", handleWheel);
        };
    }, [handleWheel]);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedNodeId && !readOnly) {
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) return;
                    handleNodeDelete(selectedNodeId);
                }
            }
            if (e.key === "Escape") {
                if (connecting) setConnecting(null);
                if (selectedNodeId) onSelectNode(null);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNodeId, readOnly, handleNodeDelete, connecting, onSelectNode]);

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    const transformStyle = {
        transform: `translate(${-canvasOffset.x}px, ${-canvasOffset.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
    };

    return (
        <div
            ref={canvasRef}
            className={`wf-canvas ${readOnly ? "wf-canvas-readonly" : ""}`}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseDown={handleCanvasMouseDown}
            onClick={handleCanvasClick}
            style={{ overflow: "hidden", position: "relative", cursor: panning ? "grabbing" : "grab" }}
        >
            <div className="wf-canvas-grid" style={transformStyle}>
                <svg className="wf-edges-svg" style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, pointerEvents: "none", overflow: "visible" }}>
                    <defs>
                        <marker id="edge-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--ink-300)" />
                        </marker>
                        <marker id="edge-arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
                        </marker>
                    </defs>
                    {edges.map(edge => {
                        const src = nodeMap[edge.source];
                        const tgt = nodeMap[edge.target];
                        if (!src || !tgt) return null;
                        const isActive = selectedNodeId === edge.source || selectedNodeId === edge.target;
                        return (
                            <path
                                key={edge.id}
                                d={getEdgePath(src, tgt)}
                                fill="none"
                                stroke={isActive ? "var(--accent)" : "var(--ink-300)"}
                                strokeWidth={isActive ? 2.5 : 1.5}
                                markerEnd={isActive ? "url(#edge-arrowhead-active)" : "url(#edge-arrowhead)"}
                                className="wf-edge-path"
                            />
                        );
                    })}
                    {connecting && nodeMap[connecting.sourceId] && (
                        <line
                            x1={nodeMap[connecting.sourceId].position.x + 120}
                            y1={nodeMap[connecting.sourceId].position.y + 35}
                            x2={mouseGrid.x}
                            y2={mouseGrid.y}
                            stroke="var(--accent)"
                            strokeWidth={2}
                            strokeDasharray="6,4"
                        />
                    )}
                </svg>
                {nodes.map(node => (
                    <div key={node.id} data-node-id={node.id}>
                        <WorkflowNode
                            node={node}
                            selected={selectedNodeId === node.id}
                            onSelect={onSelectNode}
                            onDelete={handleNodeDelete}
                            onDragStart={handleNodeDragStart}
                            onOutputClick={handleNodeOutputClick}
                        />
                    </div>
                ))}
                {nodes.length === 0 && (
                    <div className="wf-canvas-empty">
                        <div className="wf-canvas-empty-icon">⊞</div>
                        <h3>Drag and drop nodes from the palette</h3>
                        <p>Start building your workflow by adding nodes to this canvas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
