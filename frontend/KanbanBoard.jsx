import { useState } from "react";
import { formatCurrency } from "../../utils/formatters";
import { IconPlus } from "../ui/Icons";

export function KanbanBoard({ columns, onMoveDeal, onAddDeal, onCardClick }) {
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);

  function handleDragStart(dealId) {
    setDraggedDealId(dealId);
  }

  function handleDragOver(e, stageId) {
    e.preventDefault();
    setDragOverStageId(stageId);
  }

  function handleDrop(stageId) {
    if (draggedDealId) onMoveDeal(draggedDealId, stageId);
    setDraggedDealId(null);
    setDragOverStageId(null);
  }

  return (
    <div className="kanban-board">
      {columns.map((col) => (
        <div
          key={col.stage.id}
          className={`kanban-column${dragOverStageId === col.stage.id ? " drag-over" : ""}`}
          onDragOver={(e) => handleDragOver(e, col.stage.id)}
          onDrop={() => handleDrop(col.stage.id)}
          onDragLeave={() => setDragOverStageId(null)}
        >
          <div className="kanban-column-header">
            <span className="kanban-stage-bar" style={{ background: col.stage.color }} />
            <span className="kanban-column-title">{col.stage.name}</span>
            <span className="kanban-column-count">{col.deal_count}</span>
          </div>
          <div className="kanban-column-total">{formatCurrency(col.total_value)}</div>

          <div className="kanban-cards">
            {col.deals.map((deal) => (
              <div
                key={deal.id}
                className={`kanban-card${draggedDealId === deal.id ? " dragging" : ""}`}
                draggable
                onDragStart={() => handleDragStart(deal.id)}
                onDragEnd={() => setDraggedDealId(null)}
                onClick={() => onCardClick?.(deal)}
              >
                <div className="kanban-card-title">{deal.title}</div>
                <div className="kanban-card-meta">
                  <span className="kanban-card-value">{formatCurrency(deal.value)}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="kanban-add-card" onClick={() => onAddDeal(col.stage.id)}>
            <IconPlus width={13} height={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            Add deal
          </button>
        </div>
      ))}
    </div>
  );
}