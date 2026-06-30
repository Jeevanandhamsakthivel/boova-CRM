import { useState, useEffect } from "react";
import { onboardingApi } from "../api/onboardingApi";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const STEPS = ["Welcome", "Industry", "Pipeline", "Team", "Complete"];

export default function OnboardingWizardPage() {
    const toast = useToast();
    const [step, setStep] = useState(0);
    const [industries, setIndustries] = useState(null);
    const [selectedIndustry, setSelectedIndustry] = useState("");
    const [starterPack, setStarterPack] = useState(null);

    useEffect(() => {
        onboardingApi.listIndustries().then(res => setIndustries(res.data.data));
    }, []);

    function handleIndustrySelect(industry) {
        setSelectedIndustry(industry);
        onboardingApi.getStarterPack(industry).then(res => setStarterPack(res.data.data));
    }

    function handleNext() {
        if (step < STEPS.length - 1) setStep(s => s + 1);
    }

    function handleBack() {
        if (step > 0) setStep(s => s - 1);
    }

    function handleComplete() {
        toast.success("Onboarding complete! Your CRM is ready.");
    }

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 0" }}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 8, marginBottom: 40, justifyContent: "center" }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: i <= step ? "var(--accent)" : "var(--surface-2)",
                            color: i <= step ? "var(--ink-900)" : "var(--ink-400)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                        }}>{i + 1}</div>
                        <span style={{ fontSize: 12, color: i <= step ? "var(--ink-700)" : "var(--ink-300)" }}>{s}</span>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: 32 }}>
                {step === 0 && (
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ margin: "0 0 12px 0" }}>Welcome to PSM CRM</h2>
                        <p style={{ color: "var(--ink-400)", marginBottom: 24 }}>
                            We'll help you set up your CRM in just a few steps.
                            No dedicated admin required — we promise.
                        </p>
                        <Button onClick={handleNext}>Get Started →</Button>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h2 style={{ margin: "0 0 16px 0" }}>What industry are you in?</h2>
                        <p style={{ color: "var(--ink-400)", marginBottom: 20 }}>
                            We'll pre-configure pipelines, fields, and templates for your business type.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                            {industries && Object.entries(industries).map(([key, ind]) => (
                                <div key={key}
                                    onClick={() => handleIndustrySelect(key)}
                                    className="card"
                                    style={{
                                        padding: 16, cursor: "pointer", textAlign: "center",
                                        border: selectedIndustry === key ? "2px solid var(--accent)" : "1px solid var(--border)",
                                    }}
                                >
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ind.name}</div>
                                </div>
                            ))}
                        </div>
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext} disabled={!selectedIndustry}>Next</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 style={{ margin: "0 0 16px 0" }}>Your Pipeline</h2>
                        {starterPack && (
                            <div>
                                {(starterPack.pipelines || []).map((p, i) => (
                                    <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>{p.name}</h4>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {p.stages.map((s, j) => (
                                                <span key={j} className="badge badge-info" style={{ fontSize: 12 }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 12 }}>
                                    Fields: {(starterPack.fields || []).join(", ")}
                                </div>
                            </div>
                        )}
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext}>Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2 style={{ margin: "0 0 16px 0" }}>Invite Your Team</h2>
                        <p style={{ color: "var(--ink-400)", marginBottom: 16 }}>
                            Start with up to 2 users free, forever. Add more anytime.
                        </p>
                        <div className="field-group">
                            <label className="field-label">Team Member Email</label>
                            <input className="field-input" placeholder="colleague@company.com" />
                        </div>
                        <div className="field-group" style={{ marginTop: 12 }}>
                            <label className="field-label">Role</label>
                            <select className="field-select">
                                <option value="agent">Agent</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext}>Next</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                        <h2 style={{ margin: "0 0 12px 0" }}>You're All Set!</h2>
                        <p style={{ color: "var(--ink-400)", marginBottom: 24 }}>
                            Your CRM is configured and ready to go. No admin needed.
                        </p>
                        <Button onClick={handleComplete}>Go to Dashboard</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
