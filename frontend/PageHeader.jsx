export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-title">
        <h1>{title}</h1>
        {subtitle && <span className="page-header-subtitle">{subtitle}</span>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}