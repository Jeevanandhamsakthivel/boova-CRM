/* Minimal hand-picked icon set, stroke-based, 18x18 viewbox, no external dependency. */
const base = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

export const IconDashboard = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></svg>
);
export const IconLeads = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const IconCustomers = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="5" /></svg>
);
export const IconTasks = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
);
export const IconFollowups = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
export const IconPipeline = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 3h18v4l-7 7v6l-4-2v-4L3 7z" /></svg>
);
export const IconReports = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="6" width="3" height="12" /></svg>
);
export const IconSettings = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
export const IconUsers = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const IconAudit = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 13h6M9 17h6" /></svg>
);
export const IconSearch = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconBell = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
export const IconChevronDown = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconChevronLeft = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m15 18-6-6 6-6" /></svg>
);
export const IconChevronRight = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>
);
export const IconPlus = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconX = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconEdit = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
);
export const IconTrash = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>
);
export const IconLogout = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconMail = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" /></svg>
);
export const IconPhone = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
export const IconBuilding = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></svg>
);
export const IconCheck = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconAlertTriangle = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m10.29 3.86-8.18 14.18A1 1 0 0 0 3 19.5h18a1 1 0 0 0 .89-1.46L13.71 3.86a1 1 0 0 0-1.72 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
);
export const IconArrowRight = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconMenu = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IconTrendUp = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>
);
export const IconTarget = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
export const IconCalendar = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const IconInbox = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
);
export const IconDollar = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
export const IconActivity = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
export const IconGlobe = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
);
export const IconLinkedin = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
);
export const IconWhatsApp = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
);
export const IconStar = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
export const IconRefresh = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
);
export const IconFilter = (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);