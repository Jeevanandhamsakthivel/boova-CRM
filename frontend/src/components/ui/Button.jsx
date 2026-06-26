export function Button({
    variant = "primary",
    size,
    icon = false,
    loading = false,
    children,
    className = "",
    ...props
}) {
    const classes = [
        "btn",
        `btn-${variant}`,
        size === "sm" ? "btn-sm" : "",
        icon ? "btn-icon" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} disabled={loading || props.disabled} {...props}>
            {loading ? <span className="spinner" /> : children}
        </button>
    );
}