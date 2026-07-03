import { useState, useEffect } from "react";
import { workflowsApi } from "../api/workflowsApi";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { IconSave, IconSettings } from "../components/ui/Icons";

const DEFAULT_SETTINGS = {
    default_timezone: "UTC",
    max_execution_timeout_minutes: 60,
    max_retries: 3,
    enable_audit_log: true,
    notify_on_failure: true,
    notify_on_completion: false,
    allow_scheduled_triggers: true,
    allow_webhook_triggers: true,
    default_assignment_strategy: "round_robin",
    auto_cleanup_execution_days: 90,
};

export default function WorkflowSettingsPage() {
    const toast = useToast();
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        workflowsApi.getStats()
            .then(() => {
                const stored = localStorage.getItem("wf_settings");
                if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            })
            .catch((err) => console.error("Failed to load workflow settings:", err))
            .finally(() => setLoading(false));
    }, []);

    function updateSetting(key, value) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    function handleSave() {
        setSaving(true);
        localStorage.setItem("wf_settings", JSON.stringify(settings));
        setTimeout(() => {
            setSaving(false);
            toast.success("Workflow settings saved.");
        }, 300);
    }

    if (loading) {
        return <div className="page-loading"><Spinner size={28} /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Settings</h1>
                    <span className="page-header-subtitle">Configure global workflow engine behavior</span>
                </div>
                <div className="page-actions">
                    <Button onClick={handleSave} disabled={saving}>
                        <IconSave width={14} height={14} /> {saving ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </div>

            <div style={{ maxWidth: 700 }}>
                <div className="kpi-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: "var(--ink-900)", display: "flex", alignItems: "center", gap: 8 }}>
                        <IconSettings width={16} height={16} /> General Settings
                    </h3>

                    <div className="field-group">
                        <label className="field-label">Default Timezone</label>
                        <select className="field-select" value={settings.default_timezone} onChange={e => updateSetting("default_timezone", e.target.value)}>
                            <option value="UTC">UTC</option>
                            <option value="US/Eastern">US/Eastern</option>
                            <option value="US/Central">US/Central</option>
                            <option value="US/Mountain">US/Mountain</option>
                            <option value="US/Pacific">US/Pacific</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                            <option value="Asia/Dubai">Asia/Dubai</option>
                            <option value="Asia/Singapore">Asia/Singapore</option>
                            <option value="Australia/Sydney">Australia/Sydney</option>
                        </select>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Max Execution Timeout (minutes)</label>
                        <input className="field-input" type="number" value={settings.max_execution_timeout_minutes} onChange={e => updateSetting("max_execution_timeout_minutes", parseInt(e.target.value) || 60)} />
                    </div>

                    <div className="field-group">
                        <label className="field-label">Max Retries</label>
                        <input className="field-input" type="number" value={settings.max_retries} onChange={e => updateSetting("max_retries", parseInt(e.target.value) || 3)} />
                    </div>

                    <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 24, marginBottom: 16, color: "var(--ink-900)" }}>Notifications</h3>

                    <label className="wf-config-checkbox" style={{ marginBottom: 8 }}>
                        <input type="checkbox" checked={settings.notify_on_failure} onChange={e => updateSetting("notify_on_failure", e.target.checked)} />
                        Notify on execution failure
                    </label>
                    <label className="wf-config-checkbox" style={{ marginBottom: 8 }}>
                        <input type="checkbox" checked={settings.notify_on_completion} onChange={e => updateSetting("notify_on_completion", e.target.checked)} />
                        Notify on execution completion
                    </label>
                    <label className="wf-config-checkbox" style={{ marginBottom: 8 }}>
                        <input type="checkbox" checked={settings.enable_audit_log} onChange={e => updateSetting("enable_audit_log", e.target.checked)} />
                        Enable audit logging
                    </label>

                    <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 24, marginBottom: 16, color: "var(--ink-900)" }}>Triggers</h3>

                    <label className="wf-config-checkbox" style={{ marginBottom: 8 }}>
                        <input type="checkbox" checked={settings.allow_scheduled_triggers} onChange={e => updateSetting("allow_scheduled_triggers", e.target.checked)} />
                        Allow scheduled triggers
                    </label>
                    <label className="wf-config-checkbox" style={{ marginBottom: 8 }}>
                        <input type="checkbox" checked={settings.allow_webhook_triggers} onChange={e => updateSetting("allow_webhook_triggers", e.target.checked)} />
                        Allow webhook triggers
                    </label>

                    <div className="field-group" style={{ marginTop: 16 }}>
                        <label className="field-label">Default Assignment Strategy</label>
                        <select className="field-select" value={settings.default_assignment_strategy} onChange={e => updateSetting("default_assignment_strategy", e.target.value)}>
                            <option value="round_robin">Round Robin</option>
                            <option value="least_busy">Least Busy</option>
                            <option value="manager">Manager Assignment</option>
                            <option value="ai">AI Recommendation</option>
                        </select>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Auto-Cleanup Executions After (days)</label>
                        <input className="field-input" type="number" value={settings.auto_cleanup_execution_days} onChange={e => updateSetting("auto_cleanup_execution_days", parseInt(e.target.value) || 90)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
