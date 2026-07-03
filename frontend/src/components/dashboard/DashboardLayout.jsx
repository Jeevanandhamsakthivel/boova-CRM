import { useState, useEffect, useCallback, useRef } from "react";
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

export default function DashboardLayout({ widgets, defaultOrder, children }) {
    const [order, setOrder] = useState(() => {
        return loadLocal()?.order || [...defaultOrder];
    });
    const [hidden, setHidden] = useState(() => {
        return loadLocal()?.hidden || [];
    });
    const [customizing, setCustomizing] = useState(false);
    const serverSynced = useRef(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (mounted.current) saveLocal({ order, hidden });
    }, [order, hidden]);

    useEffect(() => {
        if (serverSynced.current) return;
        serverSynced.current = true;
        settingsApi.list({ scope: "user" })
            .then(res => {
                if (!mounted.current) return;
                const items = res.data.data || [];
                const saved = items.find(s => s.key === API_KEY);
                if (saved?.value) {
                    setOrder(saved.value.order || defaultOrder);
                    setHidden(saved.value.hidden || []);
                }
            })
            .catch((err) => console.error("Failed to load dashboard layout:", err));
    }, [defaultOrder]);

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
        setOrder(prev => {
            const items = Array.from(prev);
            const [moved] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, moved);
            return items;
        });
    }

    function toggleWidget(id) {
        setOrder(prev => {
            if (prev.includes(id)) {
                return prev.filter(w => w !== id);
            }
            return [...prev, id];
        });
        setHidden(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
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
                    {(provided, _snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="dash-widget-grid"
                            data-customizing={customizing}
                        >
                            {visibleWidgets.map(w => (
                                <div key={w.id}
                                    className={`dash-widget-cell ${w.span === 2 ? "dash-widget-cell-full" : "dash-widget-cell-half"}`}
                                >
                                    <DashboardWidget id={w.id} title={w.title} index={w.index} customizing={customizing}>
                                        {w.render()}
                                    </DashboardWidget>
                                </div>
                            ))}
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
                                        border: "1px solid var(--border)",
                                        cursor: "pointer", fontSize: 13,
                                    }}>
                                    <input type="checkbox" checked={visible} readOnly />
                                    <span style={{ fontWeight: 600, flex: 1, color: "var(--ink-800)" }}>
                                        {w.title}
                                    </span>
                                    <span style={{
                                        fontSize: 10, color: "var(--ink-400)",
                                        background: "var(--surface)", padding: "1px 6px",
                                        borderRadius: 4, border: "1px solid var(--border)",
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