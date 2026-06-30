/**
 * Lightweight SVG chart primitives — no external dependency.
 * All components are pure SVG, accessible, and responsive.
 */

/**
 * DonutChart
 * segments: [{ label, value, color }]
 */
export function DonutChart({ segments, size = 140, strokeWidth = 22, label, sublabel }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <DonutEmpty size={size} label={label} sublabel={sublabel} />;

    const r = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;

    let offset = 0;
    const slices = segments.map((seg) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const rotation = offset * 360 - 90; // start from top
        offset += pct;
        return { ...seg, dash, gap, rotation };
    });

    return (
        <div className="chart-donut-wrap" style={{ width: size, height: size, position: "relative" }}>
            <svg width={size} height={size} role="img" aria-label={label}>
                <title>{label}</title>
                {slices.map((s, i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={0}
                        style={{ transform: `rotate(${s.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
                        strokeLinecap="butt"
                    >
                        <title>{s.label}: {s.value}</title>
                    </circle>
                ))}
            </svg>
            {label && (
                <div className="chart-donut-center">
                    <span className="chart-donut-label">{label}</span>
                    {sublabel && <span className="chart-donut-sublabel">{sublabel}</span>}
                </div>
            )}
        </div>
    );
}

function DonutEmpty({ size, label }) {
    const r = (size - 22) / 2;
    const cx = size / 2;
    const cy = size / 2;
    return (
        <div className="chart-donut-wrap" style={{ width: size, height: size, position: "relative" }}>
            <svg width={size} height={size} role="img" aria-label={label}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={22} />
            </svg>
            <div className="chart-donut-center">
                <span className="chart-donut-sublabel">No data</span>
            </div>
        </div>
    );
}

/**
 * BarChart
 * bars: [{ label, value, color }]
 * formatValue: (v) => string
 */
export function BarChart({ bars, height = 120, formatValue = (v) => v, title }) {
    const max = Math.max(...bars.map((b) => b.value), 1);
    const barWidth = 32;
    const gap = 16;
    const svgWidth = bars.length * (barWidth + gap) + gap;
    const labelH = 28;
    const chartH = height - labelH;

    return (
        <div className="chart-bar-wrap">
            {title && <p className="chart-title">{title}</p>}
            <svg
                width={svgWidth}
                height={height}
                role="img"
                aria-label={title}
                style={{ overflow: "visible" }}
            >
                <title>{title}</title>
                {bars.map((bar, i) => {
                    const barH = bar.value > 0 ? Math.max((bar.value / max) * chartH, 4) : 0;
                    const x = gap + i * (barWidth + gap);
                    const y = chartH - barH;
                    return (
                        <g key={i}>
                            {/* Background track */}
                            <rect x={x} y={0} width={barWidth} height={chartH} fill="var(--surface-sunken)" rx={4} />
                            {/* Value bar */}
                            <rect x={x} y={y} width={barWidth} height={barH} fill={bar.color} rx={4}>
                                <title>{bar.label}: {formatValue(bar.value)}</title>
                            </rect>
                            {/* Value label above bar */}
                            {bar.value > 0 && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 4}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="var(--ink-600)"
                                    fontFamily="var(--font-body)"
                                >
                                    {formatValue(bar.value)}
                                </text>
                            )}
                            {/* x-axis label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartH + 16}
                                textAnchor="middle"
                                fontSize={11}
                                fill="var(--ink-400)"
                                fontFamily="var(--font-body)"
                            >
                                {bar.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/**
 * ProgressRing
 * pct: 0–100
 */
export function ProgressRing({ pct, size = 72, strokeWidth = 7, color = "var(--success)", label, sublabel }) {
    const r = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const filled = (Math.min(pct, 100) / 100) * circumference;
    const gap = circumference - filled;

    return (
        <div className="chart-ring-wrap" style={{ width: size, height: size, position: "relative" }}>
            <svg width={size} height={size} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
                <title>{label}: {Math.round(pct)}%</title>
                {/* Track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={strokeWidth} />
                {/* Progress */}
                {pct > 0 && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${filled} ${gap}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
                    />
                )}
            </svg>
            <div className="chart-ring-center">
                <span className="chart-ring-pct">{Math.round(pct)}%</span>
            </div>
            {(label || sublabel) && (
                <div className="chart-ring-label">
                    {label && <span>{label}</span>}
                    {sublabel && <span className="chart-ring-sublabel">{sublabel}</span>}
                </div>
            )}
        </div>
    );
}

/**
 * ChartLegend
 * items: [{ color, label, value }]
 */
export function ChartLegend({ items }) {
    return (
        <ul className="chart-legend">
            {items.map((item, i) => (
                <li key={i} className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ background: item.color }} />
                    <span className="chart-legend-label">{item.label}</span>
                    {item.value !== undefined && (
                        <span className="chart-legend-value">{item.value}</span>
                    )}
                </li>
            ))}
        </ul>
    );
}
