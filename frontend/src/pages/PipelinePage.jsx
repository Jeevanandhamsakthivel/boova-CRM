import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { pipelineApi, dealsApi } from "../api/pipelineApi";
import { formatCurrency } from "../utils/formatters";
import { IconPlus, IconTarget } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";

const STAGE_ACCENTS = {
    0: "#6366F1",
    1: "#3B82F6",
    2: "#F59E0B",
    3: "#F97316",
    4: "#10B981",
    5: "#14B8A6",
};

export default function PipelinePage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [stages, setStages] = useState([]);
    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const [moving, setMoving] = useState(false);

    const loadBoard = useCallback(() => {
        setLoading(true);
        Promise.all([pipelineApi.listStages(), pipelineApi.board()])
            .then(([stagesRes, boardRes]) => {
                setStages(stagesRes.data.data || []);
                setBoard(boardRes.data.data || {});
            })
            .catch(() => toast.error("Failed to load pipeline"))
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => { loadBoard(); }, [loadBoard]);

    const handleDragEnd = useCallback(async (result) => {
        if (!result.destination) return;
        const { draggableId, source, destination } = result;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        setMoving(true);
        try {
            await dealsApi.move(draggableId, destination.droppableId);
            // Optimistic update
            const srcStage = source.droppableId;
            const destStage = destination.droppableId;
            const newBoard = { ...board };
            const srcDeals = [...(newBoard[srcStage] || [])];
            const [movedDeal] = srcDeals.splice(source.index, 1);
            newBoard[srcStage] = srcDeals;
            if (srcStage === destStage) {
                const destDeals = [...srcDeals];
                destDeals.splice(destination.index, 0, movedDeal);
                newBoard[destStage] = destDeals;
            } else {
                const destDeals = [...(newBoard[destStage] || [])];
                destDeals.splice(destination.index, 0, { ...movedDeal, stage_id: destStage });
                newBoard[destStage] = destDeals;
            }
            setBoard(newBoard);
            toast.success("Deal moved");
        } catch {
            toast.error("Failed to move deal");
            loadBoard();
        } finally {
            setMoving(false);
        }
    }, [board, toast, loadBoard]);

    const totalPipelineValue = stages.reduce((sum, stage) => {
        const deals = board[stage.id] || board[stage.name] || [];
        return sum + deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    }, 0);

    const totalDeals = stages.reduce((sum, stage) => {
        return sum + ((board[stage.id] || board[stage.name] || []).length);
    }, 0);

    if (loading) return (
        <div className="page-loading">
            <div className="spinner spinner-lg" />
        </div>
    );

    return (
        <div className="pipeline-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-title">
                    <h1>Pipeline</h1>
                    <span className="page-header-subtitle">
                        {totalDeals} deals · {formatCurrency(totalPipelineValue)} total value
                    </span>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => navigate("/customers")}>
                        <IconPlus width={15} height={15} />
                        Add Deal
                    </button>
                </div>
            </div>

            {/* Pipeline Stats */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 20,
            }}>
                <div className="stat-card">
                    <div className="stat-label">Total Pipeline</div>
                    <div className="stat-value" style={{ color: "var(--accent-strong)" }}>
                        {formatCurrency(totalPipelineValue)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Open Deals</div>
                    <div className="stat-value">{totalDeals}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg. Deal Size</div>
                    <div className="stat-value">
                        {totalDeals > 0 ? formatCurrency(Math.round(totalPipelineValue / totalDeals)) : formatCurrency(0)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Stages</div>
                    <div className="stat-value">{stages.length}</div>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="pipeline-board">
                    {stages.length === 0 && (
                        <div className="empty-state" style={{ width: "100%" }}>
                            <IconTarget width={48} height={48} />
                            <h3>No pipeline stages</h3>
                            <p>Create stages in settings to start tracking your sales pipeline.</p>
                        </div>
                    )}
                    {stages.map((stage, idx) => {
                        const deals = board[stage.id] || board[stage.name] || [];
                        const stageValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                        const accent = STAGE_ACCENTS[idx] || STAGE_ACCENTS[idx % Object.keys(STAGE_ACCENTS).length];

                        return (
                            <div key={stage.id} className="pipeline-column">
                                <div className="pipeline-column-header" style={{ borderLeft: `3px solid ${accent}` }}>
                                    <div className="pipeline-column-name">{stage.name}</div>
                                    <div className="pipeline-column-meta">
                                        {deals.length} deal{deals.length !== 1 ? "s" : ""}
                                        {stageValue > 0 && ` · ${formatCurrency(stageValue)}`}
                                    </div>
                                </div>
                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="pipeline-column-cards"
                                            style={{
                                                background: snapshot.isDraggingOver ? "var(--accent-tint)" : "var(--surface-sunken)",
                                                borderColor: snapshot.isDraggingOver ? "var(--accent)" : "var(--border)",
                                            }}
                                        >
                                            {deals.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="pipeline-empty-card">
                                                    No deals yet
                                                </div>
                                            )}
                                            {deals.map((deal, index) => (
                                                <Draggable
                                                    key={deal.id}
                                                    draggableId={deal.id}
                                                    index={index}
                                                    isDragDisabled={moving}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="pipeline-card"
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                opacity: snapshot.isDragging ? 0.85 : 1,
                                                                transform: snapshot.isDragging
                                                                    ? `${provided.draggableProps.style?.transform || ""} rotate(3deg)`
                                                                    : provided.draggableProps.style?.transform,
                                                            }}
                                                            onClick={() => {
                                                                if (!snapshot.isDragging) {
                                                                    // Navigate to customer workspace if customer exists
                                                                    if (deal.customer_id) {
                                                                        navigate(`/customers/${deal.customer_id}`);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <div className="pipeline-card-title">
                                                                {deal.title || deal.name || "Unnamed Deal"}
                                                            </div>
                                                            {deal.value > 0 && (
                                                                <div className="pipeline-card-value">
                                                                    {formatCurrency(deal.value)}
                                                                </div>
                                                            )}
                                                            {deal.customer_name && (
                                                                <div className="pipeline-card-customer">
                                                                    {deal.customer_name}
                                                                </div>
                                                            )}
                                                            <div className="pipeline-card-footer">
                                                                <div className="pipeline-card-owner">
                                                                    <div
                                                                        className="avatar avatar-sm avatar-dark"
                                                                        style={{ width: 22, height: 22, fontSize: 9 }}
                                                                    >
                                                                        {(deal.assigned_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {deal.assigned_name || "Unassigned"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
