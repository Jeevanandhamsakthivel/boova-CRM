import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useWorkspace } from "../hooks/useWorkspace";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { WorkspaceHeader } from "../components/features/WorkspaceHeader";
import { SlideOverPanel } from "../components/ui/SlideOverPanel";
import { NoteForm } from "../components/features/NoteForm";
import { TaskFormModal } from "../components/features/TaskFormModal";
import { DealFormModal } from "../components/features/DealFormModal";
import { FollowUpFormModal } from "../components/features/FollowUpFormModal";
import { TimelineTab } from "../components/features/workspace/TimelineTab";
import { TasksTab } from "../components/features/workspace/TasksTab";
import { DealsTab } from "../components/features/workspace/DealsTab";
import { FollowUpsTab } from "../components/features/workspace/FollowUpsTab";
import { NotesTab } from "../components/features/workspace/NotesTab";
import { FilesTab } from "../components/features/workspace/FilesTab";
import { AnalyticsTab } from "../components/features/workspace/AnalyticsTab";

const TABS = [
    { key: "timeline", label: "Timeline" },
    { key: "tasks", label: "Tasks", summaryKey: "open_tasks_count" },
    { key: "deals", label: "Deals", summaryKey: "active_deals_count" },
    { key: "followups", label: "Follow-ups", summaryKey: "pending_followups_count" },
    { key: "notes", label: "Notes" },
    { key: "files", label: "Files" },
    { key: "analytics", label: "Analytics" },
];

function getInitialTab() {
    const hash = window.location.hash.replace("#", "");
    return TABS.some((t) => t.key === hash) ? hash : "timeline";
}

function Skeleton({ height = 14, width = "100%", style }) {
    return <div className="skeleton" style={{ height, width, borderRadius: 6, ...style }} />;
}

function WorkspaceHeaderSkeleton() {
    return (
        <div className="ws-skeleton-header">
            <Skeleton height={56} width={56} style={{ borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton height={24} width={220} />
                <Skeleton height={13} width={380} />
                <Skeleton height={13} width={260} />
            </div>
        </div>
    );
}

export default function CustomerWorkspacePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isManager, isAgent } = useAuth();
    const toast = useToast();

    const { customer, summary, recentActivities, loading, error, retry, setCustomer, setSummary, setRecentActivities } =
        useWorkspace(id);

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [slideOver, setSlideOver] = useState(null); // null | "note" | "task" | "deal" | "followup"

    // Redirect to 404 when customer not found
    useEffect(() => {
        if (!loading && error?.includes("not found")) {
            toast.error("Customer not found.");
            navigate("/customers");
        }
    }, [loading, error, navigate, toast]);

    function changeTab(key) {
        setActiveTab(key);
        history.replaceState(null, "", `#${key}`);
    }

    function openPanel(type) {
        setSlideOver(type);
    }

    function closePanel() {
        setSlideOver(null);
    }

    // Keyboard shortcuts
    useKeyboardShortcuts(
        useMemo(
            () => ({
                n: () => openPanel("note"),
                t: () => openPanel("task"),
                d: () => openPanel("deal"),
                f: () => openPanel("followup"),
            }),
            []
        ),
        !loading && !!customer
    );

    const canWrite = useMemo(() => {
        if (!customer || !user) return false;
        if (isAdmin || isManager) return true;
        if (isAgent) return customer.assigned_to === user.id;
        return false;
    }, [customer, user, isAdmin, isManager, isAgent]);

    function handleCustomerSaved(updatedCustomer) {
        setCustomer(updatedCustomer);
    }

    function handleNoteCreated(note) {
        closePanel();
        // Prepend to timeline
        setRecentActivities((prev) => [note, ...prev]);
        toast.success("Note added.");
    }

    function handleTaskCreated(task) {
        closePanel();
        setSummary((prev) => prev ? { ...prev, open_tasks_count: (prev.open_tasks_count || 0) + 1 } : prev);
        toast.success("Task created.");
    }

    function handleDealCreated(deal) {
        closePanel();
        if (deal.status === "open") {
            setSummary((prev) => prev ? { ...prev, active_deals_count: (prev.active_deals_count || 0) + 1 } : prev);
        }
        toast.success("Deal created.");
    }

    function handleFollowUpCreated(followup) {
        closePanel();
        setSummary((prev) => prev ? { ...prev, pending_followups_count: (prev.pending_followups_count || 0) + 1 } : prev);
        toast.success("Follow-up scheduled.");
    }

    const slideOverTitles = {
        note: "Add Note",
        task: "Create Task",
        deal: "Add Deal",
        followup: "Schedule Follow-up",
    };

    const contextValue = useMemo(
        () => ({ customerId: id, customer, summary, refreshSummary: retry, canWrite }),
        [id, customer, summary, retry, canWrite]
    );

    if (loading) {
        return (
            <div className="ws-page">
                <WorkspaceHeaderSkeleton />
                <div className="ws-skeleton-tabs">
                    {TABS.map((t) => <Skeleton key={t.key} height={34} width={84} style={{ borderRadius: 8 }} />)}
                </div>
                <div className="ws-skeleton-content">
                    <Skeleton height={14} width="55%" />
                    <Skeleton height={14} width="75%" />
                    <Skeleton height={14} width="40%" />
                    <Skeleton height={14} width="65%" />
                </div>
            </div>
        );
    }

    if (error && !customer) {
        return (
            <div className="ws-page">
                <div className="ws-error-state">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={retry}>Retry</button>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <WorkspaceContext.Provider value={contextValue}>
            <div className="ws-page">
                <WorkspaceHeader
                    customer={customer}
                    summary={summary}
                    canWrite={canWrite}
                    onAction={{ openPanel, onCustomerSaved: handleCustomerSaved }}
                />

                {/* Tab bar */}
                <div className="ws-tab-bar" role="tablist">
                    {TABS.map((tab) => {
                        const count = tab.summaryKey ? summary?.[tab.summaryKey] : null;
                        return (
                            <button
                                key={tab.key}
                                role="tab"
                                aria-selected={activeTab === tab.key}
                                className={`ws-tab-btn${activeTab === tab.key ? " active" : ""}`}
                                onClick={() => changeTab(tab.key)}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className="ws-tab-badge">{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab panels */}
                <div className="ws-tab-panels">
                    {activeTab === "timeline" && (
                        <TimelineTab
                            customerId={id}
                            initialActivities={recentActivities}
                        />
                    )}
                    {activeTab === "tasks" && (
                        <TasksTab customerId={id} activeTab={activeTab} />
                    )}
                    {activeTab === "deals" && (
                        <DealsTab customerId={id} activeTab={activeTab} />
                    )}
                    {activeTab === "followups" && (
                        <FollowUpsTab customerId={id} activeTab={activeTab} />
                    )}
                    {activeTab === "notes" && (
                        <NotesTab customerId={id} activeTab={activeTab} canWrite={canWrite} />
                    )}
                    {activeTab === "files" && (
                        <FilesTab customerId={id} activeTab={activeTab} canWrite={canWrite} />
                    )}
                    {activeTab === "analytics" && (
                        <AnalyticsTab customerId={id} activeTab={activeTab} />
                    )}
                </div>
            </div>

            {/* Slide-over panel */}
            <SlideOverPanel
                open={!!slideOver}
                onClose={closePanel}
                title={slideOverTitles[slideOver] || ""}
            >
                {slideOver === "note" && (
                    <NoteForm customerId={id} onCreated={handleNoteCreated} onCancel={closePanel} />
                )}
                {slideOver === "task" && (
                    <TaskFormModal
                        initialData={{ related_to_type: "customer", related_to_id: id }}
                        onCreated={handleTaskCreated}
                        onCancel={closePanel}
                    />
                )}
                {slideOver === "deal" && (
                    <DealFormModal
                        initialData={{ customer_id: id }}
                        onCreated={handleDealCreated}
                        onCancel={closePanel}
                    />
                )}
                {slideOver === "followup" && (
                    <FollowUpFormModal
                        initialData={{ related_to_type: "customer", related_to_id: id }}
                        onCreated={handleFollowUpCreated}
                        onCancel={closePanel}
                    />
                )}
            </SlideOverPanel>
        </WorkspaceContext.Provider>
    );
}
