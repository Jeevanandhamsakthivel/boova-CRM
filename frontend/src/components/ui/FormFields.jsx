export function FieldGroup({ label, required, error, hint, children }) {
    return (
        <div className="field-group">
            {label && (
                <label className="field-label">
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            {children}
            {error && <span className="field-error">{error}</span>}
            {!error && hint && <span className="field-hint">{hint}</span>}
        </div>
    );
}

export function TextInput(props) {
    return <input className="field-input" {...props} />;
}

export function TextArea(props) {
    return <textarea className="field-textarea" {...props} />;
}

export function Select({ options, placeholder, ...props }) {
    return (
        <select className="field-select" {...props}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export function FieldRow({ children }) {
    return <div className="field-row">{children}</div>;
}