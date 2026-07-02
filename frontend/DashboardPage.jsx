import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../../api/miscApi";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading } from "../../components/ui/Misc";
import { formatCurrency } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi
      .summary()
      .then((res) => setSummary(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const cards = [
    { label: "Total Leads", value: summary.total_leads, sub: `${summary.new_leads} new · ${summary.qualified_leads} qualified`, onClick: () => navigate("/leads") },
    { label: "Total Customers", value: summary.total_customers, sub: "Active accounts", onClick: () => navigate("/customers") },
    { label: "Open Pipeline Value", value: formatCurrency(summary.open_deals_value), sub: `${summary.open_deals_count} open deals`, onClick: () => navigate("/pipeline") },
    { label: "Deals Won", value: summary.won_deals_count, sub: "All time", onClick: () => navigate("/pipeline") },
    { label: "Pending Tasks", value: summary.pending_tasks, sub: `${summary.overdue_tasks} overdue`, onClick: () => navigate("/tasks") },
    { label: "Pending Follow-ups", value: summary.pending_followups, sub: "Awaiting action", onClick: () => navigate("/followups") },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
        subtitle="Here's what's moving across your pipeline today."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {cards.map((card) => (
          <div key={card.label} className="stat-card" style={{ cursor: "pointer" }} onClick={card.onClick}>
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.value}</span>
            <span className="stat-sub">{card.sub}</span>
          </div>
        ))}
      </div>

      {summary.overdue_tasks > 0 && (
        <div className="alert-banner alert-error" style={{ marginTop: 20 }}>
          You have {summary.overdue_tasks} overdue task{summary.overdue_tasks > 1 ? "s" : ""}.{" "}
          <a onClick={() => navigate("/tasks?status=todo")} style={{ cursor: "pointer", fontWeight: 600 }}>
            Review now
          </a>
        </div>
      )}
    </div>
  );
}