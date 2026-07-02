import { IconSearch } from "../ui/Icons";
import { Select } from "../ui/FormFields";

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div style={{ position: "relative", minWidth: 220 }}>
      <IconSearch width={15} height={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
      <input
        className="field-input"
        style={{ paddingLeft: 32, height: 36 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      className="field-select"
      style={{ height: 36, width: "auto" }}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}