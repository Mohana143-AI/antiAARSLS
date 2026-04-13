import { useState, useEffect } from "react";
import { adminAPI } from "../lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Users, GraduationCap, Search, Star } from "lucide-react";

const COLORS = ["hsl(250,90%,65%)", "hsl(200,85%,55%)", "hsl(152,70%,50%)", "hsl(38,95%,55%)"];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    adminAPI.getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const pieData = analytics ? [
    { name: "Skills", value: analytics.total_skills },
    { name: "Projects", value: analytics.total_projects },
    { name: "Certifications", value: analytics.total_certifications },
    { name: "Validations", value: analytics.total_validations },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and analytics</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: <Users size={20} />, label: "Students", val: analytics?.total_students, bg: "var(--accent-bg)", color: "var(--accent)" },
          { icon: <GraduationCap size={20} />, label: "Faculty", val: analytics?.total_faculty, bg: "var(--info-bg)", color: "var(--info)" },
          { icon: <Search size={20} />, label: "Recruiters", val: analytics?.total_recruiters, bg: "var(--success-bg)", color: "var(--success)" },
          { icon: <Star size={20} />, label: "Avg Score", val: analytics?.average_reputation?.toFixed(1), bg: "var(--warning-bg)", color: "var(--warning)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.val ?? "—"}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>DATA DISTRIBUTION</div>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>SYSTEM TOTALS</div>
          {[
            { label: "Total Skills", val: analytics?.total_skills },
            { label: "Total Projects", val: analytics?.total_projects },
            { label: "Total Certifications", val: analytics?.total_certifications },
            { label: "Peer Validations", val: analytics?.total_validations },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between", padding: "12px 0",
              borderBottom: "1px solid var(--border)"
            }}>
              <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
              <span style={{ fontWeight: 700 }}>{s.val ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
