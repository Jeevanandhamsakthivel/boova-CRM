import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { settingsApi } from "../../api/miscApi";
import DashboardWidget from "./DashboardWidget";

const LS_KEY = "psm_dashboard_layout";
const API_KEY = "dashboard_layout";

function loadLocal() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveLocal(val) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(val)); } catch {}
}

function getDefault(ids) {
    return { order: [...ids], hidden: [] };
}

export default function DashboardLayout({ widgets, defaultOrder, children }) {
    const [order, setOrder] = useState(() => {
        return loadLocal()?.order || [...defaultOrder];
    });
    const [hidden, setHidden] = useState(() => {
        return loadLocal()?.hidden || [];
    });
    const [customizing, setCustomizing] = useState(false);

    useEffect(() => { saveLocal({ order, hidden }); }, [order, hidden]);

    // Sync from server once on mount
    useEffect(() => {
        settingsApi.list({ scope: "user" })
            .then(res => {
                const items = res.data.data || [];
                const saved = items.find(s => s.key === API_KEY);
                if (saved?.value) {
                    setOrder(saved.value.order || defaultOrder);
                    setHidden(saved.value.hidden || []);
                }
            })
            .catch(() => {});
    }, []);

    const persist = useCallback(async (newOrder, newHidden) => {
        try {
            await settingsApi.upsert({
                key: API_KEY,
                value: { order: newOrder, hidden: newHidden },
                scope: "user",
            });
        } catch {}
    }, []);

    function handleDragEnd(result) {
        if (!result.destination) return;
        const items = Array.from(order);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setOrder(items);
    }

    function toggleWidget(id) {
        if (order.includes(id)) {
            setOrder(order.filter(w => w !== id));
            setHidden(h => [...h, id]);
        } else {
            setHidden(h => h.filter(x => x !== id));
            setOrder(o => [...o, id]);
        }
    }

    function handleDone() {
        persist(order, hidden);
        setCustomizing(false);
    }

    function handleCancel() {
        const local = loadLocal();
        if (local) {
            setOrder(local.order || [...defaultOrder]);
            setHidden(local.hidden || []);
        }
        setCustomizing(false);
    }

    const visibleWidgets = order
        .map((id, idx) => {
            const w = widgets.find(w => w.id === id);
            return w ? { ...w, index: idx } : null;
        })
        .filter(Boolean);

    const hiddenWidgets = widgets.filter(w => hidden.includes(w.id));

    return (
        <div>
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 18px", marginBottom: 20,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
            }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-700)", marginRight: "auto" }}>
                    {customizing ? "Drag widgets to reorder. Add or remove from the panel." : "Dashboard Overview"}
                </span>
                {!customizing ? (
                    <button onClick={() => setCustomizing(true)} style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
                        background: "var(--surface-sunken)", color: "var(--ink-600)",
                    }}>
                        ✎ Customize
                    </button>
                ) : (
                    <>
                        <button onClick={handleDone} style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
                            background: "var(--accent)", color: "#fff",
                        }}>
                            ✓ Done
                        </button>
                        <button onClick={handleCancel} style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
                            background: "var(--surface-sunken)", color: "var(--ink-600)",
                        }}>
                            Cancel
                        </button>
                    </>
                )}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dashboard" direction="vertical">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 20,
                                marginBottom: 24,
                                minHeight: customizing ? 120 : 0,
                            }}
                        >
                            {visibleWidgets.map(w => (
                                <div key={w.id} style={w.span === 2 ? { gridColumn: "1 / -1" } : { gridColumn: "span 1" }}>
                                    <DashboardWidget id={w.id} title={w.title} index={w.index} customizing={customizing}>
                                        {w.render()}
                                    </DashboardWidget>
                                </div>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {children}

            {customizing && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
                    zIndex: 999, display: "flex", justifyContent: "flex-end",
                }} onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
                    <div style={{
                        width: 320, background: "var(--surface)", height: "100%",
                        borderLeft: "1px solid var(--border)", padding: 24,
                        overflowY: "auto", display: "flex", flexDirection: "column", gap: 8,
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                            Widgets
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 12 }}>
                            {hiddenWidgets.length} widgets available
                        </p>
                        {widgets.map(w => {
                            const visible = order.includes(w.id);
                            return (
                                <div key={w.id} onClick={() => toggleWidget(w.id)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", borderRadius: "var(--radius-sm)",
                                        background: visible ? "var(--accent-tint)" : "var(--surface-sunken)",
                                        border: "1px solid var(--border-hairline)",
                                        cursor: "pointer", fontSize: 13,
                                    }}>
                                    <input type="checkbox" checked={visible} readOnly />
                                    <span style={{ fontWeight: 600, flex: 1, color: "var(--ink-800)" }}>
                                        {w.title}
                                    </span>
                                    <span style={{
                                        fontSize: 10, color: "var(--ink-400)",
                                        background: "var(--surface)", padding: "1px 6px",
                                        borderRadius: 4, border: "1px solid var(--border-hairline)",
                                    }}>
                                        {w.span === 2 ? "Full" : "Half"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}