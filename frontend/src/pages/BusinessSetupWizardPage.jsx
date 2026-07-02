import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setupWizardApi } from "../api/setupWizardApi";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const STEPS = [
    { id: "basic", label: "Business Info" },
    { id: "template", label: "Select Template" },
    { id: "ai-discovery", label: "AI Discovery" },
    { id: "preview", label: "Preview" },
    { id: "employees", label: "Employees" },
    { id: "generating", label: "Generate" },
    { id: "review", label: "Review" },
    { id: "complete", label: "Complete" },
];

const COUNTRIES = [
    "United States", "Canada", "United Kingdom", "Australia", "India",
    "Germany", "France", "Brazil", "Japan", "Singapore", "UAE", "Other",
];

const LANGUAGES = ["English", "Spanish", "French", "German", "Arabic", "Hindi", "Chinese", "Portuguese"];

const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata",
    "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

const BUSINESS_TYPES_LIST = [
    { id: "manufacturing", name: "Manufacturing", icon: "🏭", desc: "Production & supply chain" },
    { id: "construction", name: "Construction", icon: "🏗️", desc: "Project-based building" },
    { id: "healthcare", name: "Healthcare", icon: "🏥", desc: "Patient care & clinical" },
    { id: "hospital", name: "Hospital", icon: "🏨", desc: "Multi-specialty care" },
    { id: "clinic", name: "Clinic", icon: "🩺", desc: "Outpatient consultation" },
    { id: "pharmacy", name: "Pharmacy", icon: "💊", desc: "Medicine & dispensary" },
    { id: "school", name: "School", icon: "🏫", desc: "K-12 education" },
    { id: "college", name: "College", icon: "🎓", desc: "Undergraduate education" },
    { id: "university", name: "University", icon: "🏛️", desc: "Higher education & research" },
    { id: "retail_store", name: "Retail Store", icon: "🏪", desc: "Store & e-commerce" },
    { id: "wholesale", name: "Wholesale", icon: "📦", desc: "B2B bulk distribution" },
    { id: "logistics", name: "Logistics", icon: "🚚", desc: "Transport & shipping" },
    { id: "transportation", name: "Transportation", icon: "🚌", desc: "Passenger & fleet" },
    { id: "real_estate", name: "Real Estate", icon: "🏠", desc: "Property & brokerage" },
    { id: "software_company", name: "Software Company", icon: "💻", desc: "Product & SaaS" },
    { id: "it_services", name: "IT Services", icon: "🖥️", desc: "Tech consulting & MSP" },
    { id: "digital_marketing", name: "Digital Marketing", icon: "📱", desc: "Marketing agency" },
    { id: "finance", name: "Finance", icon: "💰", desc: "Financial services" },
    { id: "insurance", name: "Insurance", icon: "🛡️", desc: "Insurance & claims" },
    { id: "law_firm", name: "Law Firm", icon: "⚖️", desc: "Legal practice" },
    { id: "hotel", name: "Hotel", icon: "🏨", desc: "Hospitality & lodging" },
    { id: "restaurant", name: "Restaurant", icon: "🍽️", desc: "Food & dining" },
    { id: "ngo", name: "NGO", icon: "🤝", desc: "Non-profit & charity" },
    { id: "government", name: "Government", icon: "🏛️", desc: "Public sector" },
    { id: "startup", name: "Startup", icon: "🚀", desc: "Early stage venture" },
    { id: "consultancy", name: "Consultancy", icon: "📊", desc: "Management consulting" },
    { id: "custom_business", name: "Custom Business", icon: "🔧", desc: "Tailor your own" },
];

export default function BusinessSetupWizardPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [basicInfo, setBasicInfo] = useState({
        company_name: "",
        business_name: "",
        business_type: "",
        employee_count: 10,
        branch_count: 1,
        country: "",
        timezone: "UTC",
        language: "English",
    });
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [aiDescription, setAiDescription] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [generatedResult, setGeneratedResult] = useState(null);
    const [generatingProgress, setGeneratingProgress] = useState(0);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [expandedPreview, setExpandedPreview] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", role: "", department: "", manager: "", phone: "", team: "", branch: "Head Office" });

    const filteredTemplates = BUSINESS_TYPES_LIST.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const validateBasicInfo = useCallback(() => {
        if (!basicInfo.company_name.trim()) { toast.error("Company name is required"); return false; }
        if (!basicInfo.business_name.trim()) { toast.error("Business name is required"); return false; }
        if (!basicInfo.country) { toast.error("Please select a country"); return false; }
        return true;
    }, [basicInfo, toast]);

    const handleBasicInfoNext = useCallback(() => {
        if (validateBasicInfo()) {
            setStep(1);
        }
    }, [validateBasicInfo]);

    const handleTemplateSelect = useCallback(async (templateId) => {
        setSelectedTemplate(templateId);
        setBasicInfo(prev => ({ ...prev, business_type: templateId }));
        setLoading(true);
        try {
            const res = await setupWizardApi.getTemplateDetail(templateId);
            setAnalysis(res.data.data);
        } catch {
            setAnalysis(null);
        }
        setLoading(false);
        setStep(2);
    }, []);

    const handleAiAnalyze = useCallback(async () => {
        if (!aiDescription.trim()) {
            toast.error("Please describe your business");
            return;
        }
        setLoading(true);
        try {
            const res = await setupWizardApi.analyze(aiDescription, basicInfo);
            setAnalysis(res.data.data);
            const previewRes = await setupWizardApi.quickPreview({
                business_type: res.data.data.business_type,
                description: aiDescription,
                basic_info: basicInfo,
            });
            setPreviewData(previewRes.data.data);
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || "Analysis failed");
        }
        setLoading(false);
    }, [aiDescription, basicInfo, toast]);

    const handleSkipAi = useCallback(async () => {
        setLoading(true);
        try {
            const bt = selectedTemplate || basicInfo.business_type || "custom_business";
            const res = await setupWizardApi.quickPreview({
                business_type: bt,
                basic_info: basicInfo,
            });
            setPreviewData(res.data.data);
            setStep(3);
        } catch {
            toast.error("Preview failed");
        }
        setLoading(false);
    }, [selectedTemplate, basicInfo, toast]);

    const handleFinalize = useCallback(async () => {
        setStep(5);
        setLoading(true);
        setGeneratingProgress(0);

        const progressInterval = setInterval(() => {
            setGeneratingProgress(prev => Math.min(prev + 15, 90));
        }, 400);

        try {
            const res = await setupWizardApi.generate(basicInfo, analysis || {}, employees);
            clearInterval(progressInterval);
            setGeneratingProgress(100);
            setGeneratedResult(res.data.data);
            setTimeout(() => {
                setStep(6);
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            toast.error(err.response?.data?.message || "Generation failed");
            setStep(4);
        }
        setLoading(false);
    }, [basicInfo, analysis, employees, toast]);

    const handleSave = useCallback(async () => {
        setLoading(true);
        try {
            const res = await setupWizardApi.save(basicInfo, analysis || {}, employees);
            setSaveSuccess(true);
            toast.success(res.data.message || "Organization created successfully!");
            setTimeout(() => {
                setStep(7);
            }, 800);
        } catch (err) {
            toast.error(err.response?.data?.message || "Save failed");
        }
        setLoading(false);
    }, [basicInfo, analysis, employees, navigate, toast]);

    const handleBack = useCallback(() => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    }, [step]);

    const handleInputChange = useCallback((field, value) => {
        setBasicInfo(prev => ({ ...prev, [field]: value }));
    }, []);

    const addEmployee = useCallback(() => {
        if (!employeeForm.name.trim()) { toast.error("Employee name is required"); return; }
        if (!employeeForm.role.trim()) { toast.error("Role is required"); return; }
        if (!employeeForm.department.trim()) { toast.error("Department is required"); return; }
        const newEmp = {
            id: Date.now().toString(),
            ...employeeForm,
            manager_id: employeeForm.manager ? employees.find(e => e.name.toLowerCase() === employeeForm.manager.toLowerCase())?.id || "" : "",
        };
        if (editingEmployee) {
            setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? newEmp : e));
            setEditingEmployee(null);
        } else {
            setEmployees(prev => [...prev, newEmp]);
        }
        setEmployeeForm({ name: "", email: "", role: "", department: "", manager: "", phone: "", team: "", branch: "Head Office" });
        setShowEmployeeForm(false);
    }, [employeeForm, editingEmployee, employees, toast]);

    const removeEmployee = useCallback((id) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    }, []);

    const editEmployee = useCallback((emp) => {
        setEditingEmployee(emp);
        setEmployeeForm({
            name: emp.name,
            email: emp.email || "",
            role: emp.role,
            department: emp.department,
            manager: emp.manager || "",
            phone: emp.phone || "",
            team: emp.team || "",
            branch: emp.branch || "Head Office",
        });
        setShowEmployeeForm(true);
    }, []);

    const handleCsvImport = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const res = await setupWizardApi.parseCsv(file);
            const parsed = res.data.data.employees;
            const mapped = parsed.map(emp => ({
                id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
                ...emp,
                manager_id: emp.manager_name ? "" : "",
                branch: emp.branch || "Head Office",
            }));
            setEmployees(prev => [...prev, ...mapped]);
            toast.success(`${mapped.length} employees imported from CSV`);
        } catch (err) {
            toast.error(err.response?.data?.message || "CSV import failed");
        }
        setLoading(false);
        e.target.value = "";
    }, [toast]);

    const managerOptions = employees.map(e => e.name);
    const departmentOptions = analysis?.departments?.map(d => d.name) || [];
    const roleOptions = analysis?.roles?.map(r => r.name) || [];

    return (
        <div className="setup-wizard-page">
            <style>{`
                .setup-wizard-page {
                    max-width: 880px;
                    margin: 0 auto;
                    padding: 32px 24px 60px;
                }
                .wizard-progress {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 40px;
                    padding: 0 16px;
                }
                .progress-step {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .progress-dot {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                    transition: all var(--transition-base);
                    flex-shrink: 0;
                }
                .progress-dot.active {
                    background: var(--accent);
                    color: var(--ink-900);
                    box-shadow: var(--shadow-glow);
                }
                .progress-dot.completed {
                    background: var(--accent-green);
                    color: white;
                }
                .progress-dot.pending {
                    background: var(--surface-2);
                    color: var(--ink-400);
                    border: 1px solid var(--border);
                }
                .progress-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--ink-400);
                    white-space: nowrap;
                }
                .progress-label.active {
                    color: var(--accent);
                    font-weight: 600;
                }
                .progress-connector {
                    width: 24px;
                    height: 2px;
                    background: var(--border);
                    flex-shrink: 0;
                }
                .progress-connector.completed {
                    background: var(--accent-green);
                }
                .wizard-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    padding: 32px;
                    box-shadow: var(--shadow-md);
                }
                .wizard-title {
                    font-size: 22px;
                    font-weight: 700;
                    margin: 0 0 8px;
                    color: var(--ink-800);
                }
                .wizard-subtitle {
                    font-size: 14px;
                    color: var(--ink-500);
                    margin: 0 0 24px;
                    line-height: 1.5;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .form-grid .full-width {
                    grid-column: 1 / -1;
                }
                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .field-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--ink-600);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .field-input, .field-select {
                    padding: 10px 12px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-size: 14px;
                    background: var(--surface);
                    color: var(--ink-800);
                    transition: border-color var(--transition-fast);
                }
                .field-input:focus, .field-select:focus {
                    outline: none;
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px var(--accent-tint);
                }
                .template-gallery {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 12px;
                    max-height: 420px;
                    overflow-y: auto;
                    padding: 4px;
                }
                .template-card {
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    text-align: center;
                    transition: all var(--transition-base);
                    background: var(--surface);
                }
                .template-card:hover {
                    border-color: var(--accent-subtle);
                    box-shadow: var(--shadow-sm);
                    transform: translateY(-1px);
                }
                .template-card.selected {
                    border-color: var(--accent);
                    background: var(--accent-tint);
                    box-shadow: var(--shadow-glow);
                }
                .template-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                    display: block;
                }
                .template-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--ink-800);
                }
                .template-desc {
                    font-size: 11px;
                    color: var(--ink-500);
                    margin-top: 4px;
                }
                .search-input {
                    width: 100%;
                    padding: 10px 16px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-size: 14px;
                    background: var(--surface);
                    margin-bottom: 16px;
                    color: var(--ink-800);
                }
                .search-input:focus {
                    outline: none;
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px var(--accent-tint);
                }
                .ai-textarea {
                    width: 100%;
                    min-height: 160px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    font-size: 14px;
                    line-height: 1.6;
                    background: var(--surface);
                    resize: vertical;
                    color: var(--ink-800);
                    font-family: var(--font-body);
                }
                .ai-textarea:focus {
                    outline: none;
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px var(--accent-tint);
                }
                .ai-hints {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 12px;
                }
                .ai-hint {
                    padding: 6px 12px;
                    background: var(--accent-tint);
                    border: 1px solid var(--accent-glow);
                    border-radius: var(--radius-full);
                    font-size: 12px;
                    color: var(--accent);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .ai-hint:hover {
                    background: var(--accent-glow);
                }
                .analysis-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .analysis-stat {
                    background: var(--surface-sunken);
                    padding: 16px;
                    border-radius: var(--radius-md);
                    text-align: center;
                }
                .analysis-stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--accent);
                }
                .analysis-stat-label {
                    font-size: 11px;
                    color: var(--ink-500);
                    margin-top: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .lifecycle-bar {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                    margin: 12px 0;
                }
                .lifecycle-stage {
                    padding: 4px 12px;
                    border-radius: var(--radius-full);
                    font-size: 11px;
                    font-weight: 600;
                    background: var(--accent-tint);
                    color: var(--accent);
                    border: 1px solid var(--accent-glow);
                }
                .preview-section {
                    margin-bottom: 20px;
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }
                .preview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: var(--surface-sunken);
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--ink-700);
                    transition: background var(--transition-fast);
                }
                .preview-header:hover {
                    background: var(--border-light);
                }
                .preview-body {
                    padding: 16px;
                    animation: slideDown 0.2s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }
                .preview-departments {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .preview-badge {
                    padding: 6px 14px;
                    background: var(--accent-tint);
                    border-radius: var(--radius-full);
                    font-size: 12px;
                    color: var(--accent);
                    border: 1px solid var(--accent-glow);
                }
                .preview-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .preview-list-item {
                    padding: 6px 12px;
                    background: var(--surface-sunken);
                    border-radius: var(--radius-sm);
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .form-actions {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 24px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-light);
                }
                .generating-container {
                    text-align: center;
                    padding: 40px 0;
                }
                .generating-icon {
                    font-size: 56px;
                    margin-bottom: 16px;
                    display: block;
                }
                .generating-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--ink-800);
                    margin-bottom: 8px;
                }
                .generating-subtitle {
                    color: var(--ink-500);
                    font-size: 14px;
                    margin-bottom: 24px;
                }
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: var(--surface-2);
                    border-radius: var(--radius-full);
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: var(--gradient-primary);
                    border-radius: var(--radius-full);
                    transition: width 0.3s ease;
                }
                .complete-container {
                    text-align: center;
                    padding: 40px 0;
                }
                .complete-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    display: block;
                }
                .complete-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--ink-800);
                    margin-bottom: 8px;
                }
                .complete-details {
                    background: var(--surface-sunken);
                    border-radius: var(--radius-md);
                    padding: 20px;
                    margin: 20px auto;
                    max-width: 400px;
                    text-align: left;
                }
                .complete-detail-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-light);
                    font-size: 14px;
                }
                .complete-detail-item:last-child {
                    border-bottom: none;
                }
                .complete-detail-label {
                    color: var(--ink-500);
                }
                .complete-detail-value {
                    font-weight: 600;
                    color: var(--ink-800);
                }
                .generated-message {
                    background: var(--accent-green-tint);
                    border: 1px solid var(--accent-green);
                    border-radius: var(--radius-md);
                    padding: 16px;
                    margin: 20px 0;
                    text-align: center;
                }
                .generated-message h3 {
                    margin: 0 0 4px;
                    color: var(--accent-green);
                }
                .generated-message p {
                    margin: 0;
                    color: var(--ink-600);
                    font-size: 14px;
                }
                @media (max-width: 640px) {
                    .form-grid { grid-template-columns: 1fr; }
                    .template-gallery { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
                    .analysis-summary { grid-template-columns: 1fr 1fr; }
                    .wizard-card { padding: 20px; }
                    .progress-label { display: none; }
                    .progress-connector { width: 12px; }
                }
            `}</style>

            {/* Progress Indicator */}
            <div className="wizard-progress">
                {STEPS.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="progress-step">
                            <div className={`progress-dot ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`progress-label ${i === step ? 'active' : ''}`}>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`progress-connector ${i < step ? 'completed' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="wizard-card">
                {/* Step 0: Basic Information */}
                {step === 0 && (
                    <div>
                        <h2 className="wizard-title">Tell us about your business</h2>
                        <p className="wizard-subtitle">Just the basics. We'll handle the rest with AI.</p>

                        <div className="form-grid">
                            <div className="field-group full-width">
                                <label className="field-label">Company Name</label>
                                <input className="field-input" placeholder="e.g. Acme Corp"
                                    value={basicInfo.company_name}
                                    onChange={e => handleInputChange("company_name", e.target.value)} />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Business Name</label>
                                <input className="field-input" placeholder="e.g. Acme Manufacturing"
                                    value={basicInfo.business_name}
                                    onChange={e => handleInputChange("business_name", e.target.value)} />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Number of Employees</label>
                                <input className="field-input" type="number" min={1} max={100000}
                                    value={basicInfo.employee_count}
                                    onChange={e => handleInputChange("employee_count", parseInt(e.target.value) || 1)} />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Number of Branches</label>
                                <input className="field-input" type="number" min={1} max={1000}
                                    value={basicInfo.branch_count}
                                    onChange={e => handleInputChange("branch_count", parseInt(e.target.value) || 1)} />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Country</label>
                                <select className="field-select"
                                    value={basicInfo.country}
                                    onChange={e => handleInputChange("country", e.target.value)}>
                                    <option value="">Select country</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="field-group">
                                <label className="field-label">Time Zone</label>
                                <select className="field-select"
                                    value={basicInfo.timezone}
                                    onChange={e => handleInputChange("timezone", e.target.value)}>
                                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="field-group">
                                <label className="field-label">Preferred Language</label>
                                <select className="field-select"
                                    value={basicInfo.language}
                                    onChange={e => handleInputChange("language", e.target.value)}>
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <div />
                            <Button onClick={handleBasicInfoNext}>Next Step →</Button>
                        </div>
                    </div>
                )}

                {/* Step 1: Select Business Template */}
                {step === 1 && (
                    <div>
                        <h2 className="wizard-title">What type of business are you?</h2>
                        <p className="wizard-subtitle">Choose your industry. We'll configure everything automatically.</p>

                        <input className="search-input" type="text"
                            placeholder="Search business types..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} />

                        <div className="template-gallery">
                            {filteredTemplates.map(t => (
                                <div key={t.id}
                                    className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`}
                                    onClick={() => handleTemplateSelect(t.id)}>
                                    <span className="template-icon">{t.icon}</span>
                                    <div className="template-name">{t.name}</div>
                                    <div className="template-desc">{t.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={() => {
                                if (!selectedTemplate) {
                                    toast.error("Please select a business type");
                                    return;
                                }
                                setAiDescription("");
                                setStep(2);
                            }} disabled={!selectedTemplate}>
                                Next: AI Discovery →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: AI Business Discovery */}
                {step === 2 && (
                    <div>
                        <h2 className="wizard-title">Describe your business in plain words</h2>
                        <p className="wizard-subtitle">
                            Tell us how your business works. Our AI will understand and configure everything.
                        </p>

                        <textarea className="ai-textarea" placeholder={`For example:\n\n"We are a construction company with 120 employees. Sales prepares quotations. Finance approves budgets. Procurement purchases materials. Site Engineers execute projects. Support manages warranty requests."`}
                            value={aiDescription}
                            onChange={e => setAiDescription(e.target.value)} />

                        <div className="ai-hints">
                            <span className="ai-hint" onClick={() => setAiDescription(prev => prev + "We have sales, finance, and operations departments. ")}>+ Departments</span>
                            <span className="ai-hint" onClick={() => setAiDescription(prev => prev + "Customers go through inquiry, quote, approval, delivery, and support. ")}>+ Customer journey</span>
                            <span className="ai-hint" onClick={() => setAiDescription(prev => prev + "We have 3 branches in different cities. ")}>+ Multi-branch</span>
                            <span className="ai-hint" onClick={() => setAiDescription(prev => prev + "Managers approve requests. Team leads supervise work. ")}>+ Hierarchy</span>
                        </div>

                        <div className="form-actions">
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button variant="secondary" onClick={handleSkipAi}
                                    loading={loading && !aiDescription.trim()}>
                                    Skip AI →
                                </Button>
                                <Button onClick={handleAiAnalyze}
                                    loading={loading && !!aiDescription.trim()}>
                                    Analyze with AI →
                                </Button>
                            </div>
                        </div>

                        {analysis && !previewData && (
                            <div style={{ marginTop: 16, padding: 12, background: 'var(--accent-tint)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--accent)' }}>
                                {analysis.analysis_summary}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: AI Configuration Preview */}
                {step === 3 && (
                    <div>
                        <h2 className="wizard-title">AI-Generated Organization Preview</h2>
                        <p className="wizard-subtitle">
                            Our AI analyzed your input and created this configuration. Review and adjust before finalizing.
                        </p>

                        {previewData && (
                            <div className="analysis-summary">
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.departments_count}</div>
                                    <div className="analysis-stat-label">Departments</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.total_employees}</div>
                                    <div className="analysis-stat-label">Employees</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.pipeline_stages_count}</div>
                                    <div className="analysis-stat-label">Customer Stages</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.workflows_count}</div>
                                    <div className="analysis-stat-label">Workflows</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.dashboards_count}</div>
                                    <div className="analysis-stat-label">Dashboards</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{previewData.forms_count}</div>
                                    <div className="analysis-stat-label">Forms</div>
                                </div>
                            </div>
                        )}

                        {previewData && previewData.customer_lifecycle && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink-600)' }}>Customer Journey</div>
                                <div className="lifecycle-bar">
                                    {previewData.customer_lifecycle.map((stage, i) => (
                                        <span key={i} className="lifecycle-stage">{stage}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {previewData && previewData.hierarchy_tree && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'hierarchy' ? null : 'hierarchy')}>
                                    <span>👥 Organization Hierarchy</span>
                                    <span>{expandedPreview === 'hierarchy' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'hierarchy' && (
                                    <div className="preview-body">
                                        {previewData.hierarchy_tree.levels && previewData.hierarchy_tree.levels.map((level, li) => (
                                            <div key={li} style={{ marginBottom: 12 }}>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', marginBottom: 6, textTransform: 'uppercase' }}>
                                                    Level {level.level}
                                                </div>
                                                <div className="preview-departments">
                                                    {level.roles.map((role, ri) => (
                                                        <span key={ri} className="preview-badge">{role.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {analysis && analysis.departments && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'depts' ? null : 'depts')}>
                                    <span>🏢 Departments & Teams</span>
                                    <span>{expandedPreview === 'depts' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'depts' && (
                                    <div className="preview-body">
                                        <div className="preview-departments">
                                            {analysis.departments.map((d, i) => (
                                                <span key={i} className="preview-badge">{d.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {analysis && analysis.workflows && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'workflows' ? null : 'workflows')}>
                                    <span>⚡ Automated Workflows</span>
                                    <span>{expandedPreview === 'workflows' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'workflows' && (
                                    <div className="preview-body">
                                        <div className="preview-list">
                                            {analysis.workflows.map((w, i) => (
                                                <div key={i} className="preview-list-item">
                                                    <span>→</span>
                                                    <span>{w.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {analysis && analysis.forms && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'forms' ? null : 'forms')}>
                                    <span>📋 Auto-generated Forms</span>
                                    <span>{expandedPreview === 'forms' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'forms' && (
                                    <div className="preview-body">
                                        <div className="preview-list">
                                            {analysis.forms.map((f, i) => (
                                                <div key={i} className="preview-list-item">
                                                    <span>📄</span>
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-actions">
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={() => setStep(4)}>
                                Next: Add Employees →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Employee Information */}
                {step === 4 && (
                    <div>
                        <h2 className="wizard-title">Add Your Employees</h2>
                        <p className="wizard-subtitle">
                            Add team members manually or import from CSV. This helps us generate accurate workflows and permissions.
                        </p>

                        {employees.length > 0 && (
                            <div className="analysis-summary" style={{ marginBottom: 16 }}>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{employees.length}</div>
                                    <div className="analysis-stat-label">Employees Added</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{new Set(employees.map(e => e.department)).size}</div>
                                    <div className="analysis-stat-label">Departments</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{new Set(employees.map(e => e.role)).size}</div>
                                    <div className="analysis-stat-label">Roles</div>
                                </div>
                                <div className="analysis-stat">
                                    <div className="analysis-stat-value">{new Set(employees.filter(e => e.manager_id).map(e => e.manager_id)).size}</div>
                                    <div className="analysis-stat-label">Managers</div>
                                </div>
                            </div>
                        )}

                        {/* Employee List */}
                        {employees.length > 0 && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'emplist' ? null : 'emplist')}>
                                    <span>👥 Employee List ({employees.length})</span>
                                    <span>{expandedPreview === 'emplist' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'emplist' && (
                                    <div className="preview-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--ink-500)', fontWeight: 600 }}>Name</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--ink-500)', fontWeight: 600 }}>Role</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--ink-500)', fontWeight: 600 }}>Department</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--ink-500)', fontWeight: 600 }}>Manager</th>
                                                    <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--ink-500)', fontWeight: 600 }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.map(emp => (
                                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                        <td style={{ padding: '8px', fontWeight: 600 }}>{emp.name}</td>
                                                        <td style={{ padding: '8px', color: 'var(--ink-600)' }}>{emp.role}</td>
                                                        <td style={{ padding: '8px', color: 'var(--ink-600)' }}>{emp.department}</td>
                                                        <td style={{ padding: '8px', color: 'var(--ink-500)' }}>{emp.manager || '-'}</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                                            <button onClick={() => editEmployee(emp)}
                                                                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, marginRight: 8 }}>
                                                                Edit
                                                            </button>
                                                            <button onClick={() => removeEmployee(emp.id)}
                                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hierarchy Tree */}
                        {employees.length > 1 && (
                            <div className="preview-section">
                                <div className="preview-header"
                                    onClick={() => setExpandedPreview(expandedPreview === 'emphier' ? null : 'emphier')}>
                                    <span>🌳 Organization Hierarchy</span>
                                    <span>{expandedPreview === 'emphier' ? '▲' : '▼'}</span>
                                </div>
                                {expandedPreview === 'emphier' && (
                                    <div className="preview-body">
                                        {(() => {
                                            const roots = employees.filter(e => !e.manager_id && !e.manager);
                                            const renderTree = (emps, depth = 0) => (
                                                <div style={{ marginLeft: depth * 20 }}>
                                                    {emps.map(emp => {
                                                        const children = employees.filter(e => e.manager_id === emp.id || e.manager === emp.name);
                                                        return (
                                                            <div key={emp.id} style={{ marginBottom: 4 }}>
                                                                <div style={{
                                                                    padding: '6px 12px',
                                                                    background: depth === 0 ? 'var(--accent-tint)' : 'var(--surface-sunken)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    fontSize: 13,
                                                                    fontWeight: depth === 0 ? 700 : 500,
                                                                    border: '1px solid var(--border-light)',
                                                                    display: 'inline-block',
                                                                }}>
                                                                    {emp.name}
                                                                    <span style={{ color: 'var(--ink-400)', fontSize: 11, marginLeft: 8 }}>
                                                                        {emp.role}
                                                                    </span>
                                                                </div>
                                                                {children.length > 0 && renderTree(children, depth + 1)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                            return renderTree(roots.length > 0 ? roots : employees.slice(0, 1));
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add Employee Form */}
                        {showEmployeeForm && (
                            <div style={{
                                background: 'var(--surface-sunken)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 20,
                                marginBottom: 16,
                            }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>
                                    {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                                </h4>
                                <div className="form-grid">
                                    <div className="field-group">
                                        <label className="field-label">Full Name *</label>
                                        <input className="field-input" placeholder="John Doe"
                                            value={employeeForm.name}
                                            onChange={e => setEmployeeForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Email</label>
                                        <input className="field-input" placeholder="john@company.com"
                                            value={employeeForm.email}
                                            onChange={e => setEmployeeForm(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Role *</label>
                                        <input className="field-input" list="role-list" placeholder="e.g. Manager"
                                            value={employeeForm.role}
                                            onChange={e => setEmployeeForm(p => ({ ...p, role: e.target.value }))} />
                                        <datalist id="role-list">
                                            {roleOptions.map((r, i) => <option key={i} value={r} />)}
                                        </datalist>
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Department *</label>
                                        <input className="field-input" list="dept-list" placeholder="e.g. Sales"
                                            value={employeeForm.department}
                                            onChange={e => setEmployeeForm(p => ({ ...p, department: e.target.value }))} />
                                        <datalist id="dept-list">
                                            {departmentOptions.map((d, i) => <option key={i} value={d} />)}
                                        </datalist>
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Manager</label>
                                        <input className="field-input" list="mgr-list" placeholder="Reports to..."
                                            value={employeeForm.manager}
                                            onChange={e => setEmployeeForm(p => ({ ...p, manager: e.target.value }))} />
                                        <datalist id="mgr-list">
                                            {managerOptions.map((m, i) => <option key={i} value={m} />)}
                                        </datalist>
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Phone</label>
                                        <input className="field-input" placeholder="+1 555-0000"
                                            value={employeeForm.phone}
                                            onChange={e => setEmployeeForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Team</label>
                                        <input className="field-input" placeholder="e.g. Team Alpha"
                                            value={employeeForm.team}
                                            onChange={e => setEmployeeForm(p => ({ ...p, team: e.target.value }))} />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Branch</label>
                                        <select className="field-select"
                                            value={employeeForm.branch}
                                            onChange={e => setEmployeeForm(p => ({ ...p, branch: e.target.value }))}>
                                            <option value="Head Office">Head Office</option>
                                            {Array.from({ length: Math.max(0, basicInfo.branch_count - 1) }, (_, i) => (
                                                <option key={i} value={`Branch ${i + 1}`}>Branch {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <Button onClick={addEmployee}>
                                        {editingEmployee ? 'Update Employee' : 'Add Employee'}
                                    </Button>
                                    <Button variant="secondary" onClick={() => {
                                        setShowEmployeeForm(false);
                                        setEditingEmployee(null);
                                        setEmployeeForm({ name: "", email: "", role: "", department: "", manager: "", phone: "", team: "", branch: "Head Office" });
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Add / Import Buttons */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                            <Button onClick={() => { setShowEmployeeForm(true); setEditingEmployee(null); }}>
                                + Add Employee Manually
                            </Button>
                            <label style={{ cursor: 'pointer' }}>
                                <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 16px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'var(--ink-600)',
                                    background: 'var(--surface)',
                                    transition: 'all var(--transition-fast)',
                                }}>
                                    📄 Import CSV
                                </span>
                            </label>
                        </div>

                        {employees.length === 0 && !showEmployeeForm && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                background: 'var(--surface-sunken)',
                                borderRadius: 'var(--radius-md)',
                                border: '2px dashed var(--border)',
                                marginBottom: 16,
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
                                    No employees added yet
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 16 }}>
                                    Add your team to generate personalized workflows, permissions, and hierarchy.
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={handleFinalize} loading={loading}>
                                {employees.length > 0
                                    ? `Generate with ${employees.length} Employees →`
                                    : 'Skip Employees & Generate →'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Generating */}
                {step === 5 && (
                    <div className="generating-container">
                        <span className="generating-icon">⚙️</span>
                        <div className="generating-title">Building your organization...</div>
                        <div className="generating-subtitle">
                            Our AI is creating departments, workflows, dashboards, and more.
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${generatingProgress}%` }} />
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
                            {generatingProgress < 30 && "Analyzing business requirements..."}
                            {generatingProgress >= 30 && generatingProgress < 50 && "Creating organization structure..."}
                            {generatingProgress >= 50 && generatingProgress < 70 && "Generating workflows and automations..."}
                            {generatingProgress >= 70 && generatingProgress < 90 && "Building dashboards and forms..."}
                            {generatingProgress >= 90 && "Finalizing configuration..."}
                        </div>
                    </div>
                )}

                {/* Step 6: Review Generated Result */}
                {step === 6 && (
                    <div>
                        <h2 className="wizard-title">Your Organization is Ready!</h2>
                        <p className="wizard-subtitle">
                            Review the generated structure. Everything is editable after setup.
                        </p>

                        {generatedResult && (
                            <div>
                                <div className="generated-message">
                                    <h3>{generatedResult.organization?.business_type_name} Setup Complete</h3>
                                    <p>Your {generatedResult.organization?.name} CRM has been configured with industry best practices.</p>
                                </div>

                                <div className="analysis-summary">
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.departments?.length || 0}</div>
                                        <div className="analysis-stat-label">Departments</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.branches?.length || 0}</div>
                                        <div className="analysis-stat-label">Branches</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.roles?.length || 0}</div>
                                        <div className="analysis-stat-label">Roles</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.hierarchy_tree?.total_employees || 0}</div>
                                        <div className="analysis-stat-label">Employee Slots</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.pipeline_stages?.length || 0}</div>
                                        <div className="analysis-stat-label">Pipeline Stages</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.workflows?.length || 0}</div>
                                        <div className="analysis-stat-label">Workflows</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.dashboards?.length || 0}</div>
                                        <div className="analysis-stat-label">Dashboards</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.forms?.length || 0}</div>
                                        <div className="analysis-stat-label">Forms</div>
                                    </div>
                                    <div className="analysis-stat">
                                        <div className="analysis-stat-value">{generatedResult.automations?.length || 0}</div>
                                        <div className="analysis-stat-label">Automations</div>
                                    </div>
                                </div>

                                {/* Departments Preview */}
                                {generatedResult.departments && (
                                    <div className="preview-section">
                                        <div className="preview-header"
                                            onClick={() => setExpandedPreview(expandedPreview === 'gen-depts' ? null : 'gen-depts')}>
                                            <span>🏢 Departments</span>
                                            <span>{expandedPreview === 'gen-depts' ? '▲' : '▼'}</span>
                                        </div>
                                        {expandedPreview === 'gen-depts' && (
                                            <div className="preview-body">
                                                {generatedResult.departments.map((d, i) => (
                                                    <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                                                        {d.teams && d.teams.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                                                {d.teams.map((t, ti) => (
                                                                    <span key={ti} className="lifecycle-stage" style={{ fontSize: 10 }}>{t.name || t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pipeline Stages */}
                                {generatedResult.pipeline_stages && (
                                    <div className="preview-section">
                                        <div className="preview-header">
                                            <span>🔄 Customer Pipeline</span>
                                        </div>
                                        <div className="preview-body" style={{ paddingTop: 0 }}>
                                            <div className="lifecycle-bar">
                                                {generatedResult.pipeline_stages.map((s, i) => (
                                                    <span key={i} className="lifecycle-stage">{s.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Roles/Employees */}
                                {generatedResult.roles && (
                                    <div className="preview-section">
                                        <div className="preview-header"
                                            onClick={() => setExpandedPreview(expandedPreview === 'gen-roles' ? null : 'gen-roles')}>
                                            <span>👥 Roles & Employees</span>
                                            <span>{expandedPreview === 'gen-roles' ? '▲' : '▼'}</span>
                                        </div>
                                        {expandedPreview === 'gen-roles' && (
                                            <div className="preview-body">
                                                <div className="preview-list">
                                                    {generatedResult.roles.map((r, i) => (
                                                        <div key={i} className="preview-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                                                                {r.department_name} · Level {r.level} · {r.employees?.length || 0} employee(s)
                                                                {r.reports_to && ` · Reports to: ${r.reports_to}`}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-actions">
                            <Button variant="secondary" onClick={handleBack}>Back</Button>
                            <Button onClick={handleSave} loading={loading}>
                                {saveSuccess ? "✓ Saved!" : "Save & Go to Dashboard →"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 7: Complete */}
                {step === 7 && (
                    <div className="complete-container">
                        <span className="complete-icon">🎉</span>
                        <div className="complete-title">Your CRM is Ready!</div>
                        <p className="wizard-subtitle">
                            Your organization has been configured with AI-powered precision.
                        </p>
                        {generatedResult && (
                            <div className="complete-details">
                                <div className="complete-detail-item">
                                    <span className="complete-detail-label">Organization</span>
                                    <span className="complete-detail-value">{generatedResult.organization?.name}</span>
                                </div>
                                <div className="complete-detail-item">
                                    <span className="complete-detail-label">Business Type</span>
                                    <span className="complete-detail-value">{generatedResult.organization?.business_type_name}</span>
                                </div>
                                <div className="complete-detail-item">
                                    <span className="complete-detail-label">Departments</span>
                                    <span className="complete-detail-value">{generatedResult.departments?.length}</span>
                                </div>
                                <div className="complete-detail-item">
                                    <span className="complete-detail-label">Workflows</span>
                                    <span className="complete-detail-value">{generatedResult.workflows?.length}</span>
                                </div>
                                <div className="complete-detail-item">
                                    <span className="complete-detail-label">Employees</span>
                                    <span className="complete-detail-value">{generatedResult.hierarchy_tree?.total_employees}</span>
                                </div>
                            </div>
                        )}
                        <Button onClick={() => navigate("/", { replace: true })}>
                            Go to Dashboard →
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
