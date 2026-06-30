import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { dealsApi, pipelineApi } from "../../api/pipelineApi";
import { formatCurrency } from "../../utils/formatters";
import { IconPlus } from "../ui/Icons";

const STAGE_COLORS = [
    { bg: "var(--accent-blue-tint)", color: "var(--accent-blue)" },
    { bg: "var(--accent-purple-tint)", color: "var(--accent-purple)" },
    { bg: "var(--accent-amber-tint)", color: "var(--accent-amber)" },
    { bg: "var(--accent-cyan-tint)", color: "var(--accent-cyan)" },
    { bg: "var(--accent-green-tint)", color: "var(--accent-green)" },
];

export function KanbanBoard({ stages: initialStages, onDealClick, onAddDeal }) {
    const [stages, setStages] = useState(initialStages || []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPipeline = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await pipelineApi.board();
            const data = res?.data?.data || res?.data || [];
            if (data.length > 0) {
                const formatted = data.map((stage, i) => ({
                    id: stage.id || stage._id || `stage-${i}`,
                    name: stage.name || stage.title || "Stage",
                    deals: stage.deals || [],
                    color: STAGE_COLORS[i % STAGE_COLORS.length],
                }));
                setStages(formatted);
            } else if (initialStages) {
                setStages(initialStages);
            }
        } catch (err) {
            setError(err?.message || "Failed to load pipeline");
            if (initialStages) setStages(initialStages);
        } finally {
            setLoading(false);
        }
    }, [initialStages]);

    useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

    async function handleDragEnd(result) {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStages = [...stages.map(s => ({ ...s, deals: [...s.deals] }))];
        const sourceStage = newStages.find(s => s.id === source.droppableId);
        const destStage = newStages.find(s => s.id === destination.droppableId);
        if (!sourceStage || !destStage) return;

        const [movedDeal] = sourceStage.deals.splice(source.index, 1);
        if (!movedDeal) return;

        destStage.deals.splice(destination.index, 0, movedDeal);
        setStages(newStages);

        try {
            await dealsApi.move(draggableId, destination.droppableId);
        } catch {
            setStages(stages);
        }
    }

    if (loading) {
        return (
            <div className="ws-tab-loading">
                <div className="spinner" />
            </div>
        );
    }

    if (error && stages.length === 0) {
        return (
            <div className="ws-tab-error">
                <p>{error}</p>
                <button className="btn btn-primary btn-sm" onClick={fetchPipeline}>Retry</button>
            </div>
        );
    }

    if (stages.length === 0) {
        return (
            <div className="ws-empty-msg">
                <p>No pipeline stages configured. Add a stage to get started.</p>
                {onAddDeal && <button className="btn btn-primary btn-sm" onClick={onAddDeal}>Add Stage</button>}
            </div>
        );
    }

    return (
        <div className="pipeline-board">
            <DragDropContext onDragEnd={handleDragEnd}>
                {stages.map((stage, sIdx) => (
                    <div key={stage.id} className="pipeline-column">
                        <div className="pipeline-column-header">
                            <div className="pipeline-column-name">
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: stage.color?.color || "var(--accent)", marginRight: 6 }} />
                                {stage.name}
                            </div>
                            <div className="pipeline-column-meta">{stage.deals.length} deals · {formatCurrency(stage.deals.reduce((sum, d) => sum + (d.value || d.amount || 0), 0))}</div>
                        </div>
                        <Droppable droppableId={String(stage.id)}>
                            {(provided, snapshot) => (
                                <div
                                    className={`pipeline-column-cards${snapshot.isDraggingOver ? " drag-over" : ""}`}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {stage.deals.length === 0 && (
                                        <div className="pipeline-empty-card">No deals in this stage</div>
                                    )}
                                    {stage.deals.map((deal, dIdx) => (
                                        <Draggable key={deal.id || deal._id || `deal-${dIdx}`} draggableId={String(deal.id || deal._id || `deal-${dIdx}`)} index={dIdx}>
                                            {(provided, snapshot) => (
                                                <div
                                                    className={`pipeline-card${snapshot.isDragging ? " dragging" : ""}`}
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => onDealClick?.(deal)}
                                                >
                                                    <div className="pipeline-card-title">{deal.title || deal.name || "Untitled Deal"}</div>
                                                    <div className="pipeline-card-value">{formatCurrency(deal.value || deal.amount || 0)}</div>
                                                    {deal.customer_name && <div className="pipeline-card-customer">{deal.customer_name}</div>}
                                                    <div className="pipeline-card-footer">
                                                        <div className="pipeline-card-owner">
                                                            <span style={{ width: 20, height: 20, borderRadius: "50%", background: `hsl(${(sIdx * 60 + 200) % 360}, 70%, 55%)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                                                                {(deal.owner_name || deal.assigned_to || "?").charAt(0).toUpperCase()}
                                                            </span>
                                                            {deal.owner_name || deal.assigned_to || "Unassigned"}
                                                        </div>
                                                        {deal.probability && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-green)" }}>{deal.probability}%</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {onAddDeal && (
                                        <button className="pipeline-add-card" onClick={() => onAddDeal(stage.id)}>
                                            <IconPlus width={14} height={14} /> Add Deal
                                        </button>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </DragDropContext>
        </div>
    );
}
