import { Draggable } from "@hello-pangea/dnd";

const dragHandle = {
    cursor: "grab", color: "var(--ink-300)", fontSize: 16,
    display: "flex", alignItems: "center", padding: "0 4px",
    userSelect: "none",
    transition: "color 0.15s",
};

const cardStyle = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", overflow: "hidden",
    transition: "box-shadow 0.2s, border-color 0.2s",
    height: "100%",
};

const headerStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid var(--border)",
    gap: 8,
};

const titleStyle = {
    fontSize: 14, fontWeight: 700, color: "var(--ink-900)",
    fontFamily: "var(--font-display)",
};

export default function DashboardWidget({ id, title, children, index, customizing }) {
    return (
        <Draggable draggableId={id} index={index} isDragDisabled={!customizing}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.85 : 1,
                        ...(snapshot.isDragging ? { zIndex: 999 } : {}),
                    }}
                >
                    <div style={{
                        ...cardStyle,
                        borderColor: snapshot.isDragging ? "var(--accent)" : "var(--border)",
                        boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : "none",
                        outline: customizing ? "1px dashed var(--border-strong)" : "none",
                        outlineOffset: 1,
                    }}>
                        <div style={headerStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {customizing && (
                                    <span {...provided.dragHandleProps} style={dragHandle}
                                        title="Drag to reorder">
                                        ⠿
                                    </span>
                                )}
                                <span style={titleStyle}>{title}</span>
                            </div>
                            {customizing && (
                                <span style={{
                                    fontSize: 11, color: "var(--accent)", fontWeight: 600,
                                    background: "var(--accent-tint)", padding: "2px 8px",
                                    borderRadius: "var(--radius-sm)",
                                }}>
                                    {id}
                                </span>
                            )}
                        </div>
                        <div>
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}