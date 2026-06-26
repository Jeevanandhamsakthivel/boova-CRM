import { initials } from "../../utils/formatters";

export function Avatar({ name, size = "md" }) {
    const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
    return <span className={`avatar ${sizeClass}`}>{initials(name)}</span>;
}