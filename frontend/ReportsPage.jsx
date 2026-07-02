import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { reportsApi } from "../../api/miscApi";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading } from "../../components/ui/Misc";
import { formatCurrency, titleCase } from "../../utils/formatters";

const COLORS = ["#C8862D", "#3E6FA8", "#3F8F6F", "#C1543C", "#C99A2E", "#6B7080"];

export default function ReportsPage() {
  const [leadsByStatus, setLeadsByStatus] = useState([]);
  const [leadsBySource, setLeadsBySource] = useState([]);
  const [dealsByStage, setDealsByStage] = useState([]);
  const [salesPerformance, setSalesPerformance] = useState([]);
  const [tasksCompletion, setTasksCompletion] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.leadsByStatus(),
      reportsApi.leadsBySource(),
      reportsApi.dealsByStage(),
      reportsApi.salesPerformance(),
      reportsApi.tasksCompletion(),
    ])
      .then(([status, source, stage, sales, tasks]) => {
        setLeadsByStatus(status.data.data.map((d) => ({ name: titleCase(d._id), value: d.count })));
        setLeadsBySource(source.data.data.map((d) => ({ name: titleCase(d._id), value: d.count })));
        setDealsByStage(stage.data.data.map((d) => ({ name: d.stage_name, value: d.total_value, count: d.count })));
        setSalesPerformance(sales.data.data);
        setTasksCompletion(tasks.data.data.map((d) => ({ name: titleCase(d._id), value: d.count })));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <PageHeader title="Reports & Analytics" subtitle="Pipeline health and team performance at a glance." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Leads by status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leadsByStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {leadsByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by source">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leadsBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open pipeline value by stage">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={70} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="value" fill="var(--info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task completion">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={tasksCompletion} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {tasksCompletion.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Sales performance (deals won)</h3>
        {salesPerformance.length === 0 ? (
          <p className="text-muted text-sm">No closed-won deals yet.</p>
        ) : (
          <div className="data-table-wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sales rep ID</th>
                  <th>Deals won</th>
                  <th>Total value</th>
                </tr>
              </thead>
              <tbody>
                {salesPerformance.map((row) => (
                  <tr key={row._id} style={{ cursor: "default" }}>
                    <td className="cell-strong">{row._id}</td>
                    <td>{row.deals_won}</td>
                    <td>{formatCurrency(row.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card card-pad">
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}