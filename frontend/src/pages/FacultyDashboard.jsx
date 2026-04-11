import { useState, useEffect } from "react";
import { facultyAPI } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FacultyDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    facultyAPI.getAnalytics().then(setAnalytics).catch(() => {});
    facultyAPI.getPending().then(setPending).catch(() => {});
  }, []);

  const handleReview = async (id, action) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      await facultyAPI.reviewCert(id, { action });
      setPending(prev => prev.filter(c => c.id !== id));
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          pending_certifications: prev.pending_certifications - 1,
          approved_certifications: action === "approved" ? prev.approved_certifications + 1 : prev.approved_certifications,
        }));
      }
    } catch (err) { alert(err.message); }
    setLoading(prev => ({ ...prev, [id]: false }));
  };

  const chartData = analytics ? [
    { name: "Students", value: analytics.total_students },
    { name: "Skills", value: analytics.total_skills },
    { name: "Pending", value: analytics.pending_certifications },
    { name: "Approved", value: analytics.approved_certifications },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p>Review certifications and monitor student progress</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Total Students", val: analytics?.total_students, bg: "var(--accent-bg)", color: "var(--accent)" },
          { icon: "🎯", label: "Total Skills", val: analytics?.total_skills, bg: "var(--info-bg)", color: "var(--info)" },
          { icon: "⏳", label: "Pending Certs", val: analytics?.pending_certifications, bg: "var(--warning-bg)", color: "var(--warning)" },
          { icon: "✅", label: "Approved Certs", val: analytics?.approved_certifications, bg: "var(--success-bg)", color: "var(--success)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.val ?? "—"}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>OVERVIEW</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="hsl(250,90%,65%)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pending Certifications */}
      <h2 style={{ fontSize: "1.1rem", marginBottom: 16 }}>📋 Pending Certification Reviews</h2>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Certificate</th>
              <th>Issuer</th>
              <th>Risk Level</th>
              <th>Credential</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.profiles?.full_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.profiles?.department}</div>
                </td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.issuer}</td>
                <td>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <span className={`badge ${
                      c.risk_level === "high" ? "badge-danger" : 
                      c.risk_level === "medium" ? "badge-warning" : "badge-success"
                    }`}>
                      {c.risk_level === "high" ? "⚠️ High Risk" : 
                       c.risk_level === "medium" ? "🔍 Medium Risk" : "✅ Low Risk"}
                    </span>
                    {c.risk_details && (
                      <div className="risk-tooltip" style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: "0.7rem",
                        width: 200,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 10,
                        marginBottom: 8,
                        pointerEvents: "none"
                      }}>
                        <strong>Details:</strong><br />
                        {c.risk_details.reason}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {c.credential_url ? <a href={c.credential_url} target="_blank" rel="noopener">🔗 View</a> : "—"}
                    {c.proof_url && <a href={c.proof_url} target="_blank" rel="noopener">🖼️ Proof</a>}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-success btn-sm" disabled={loading[c.id]}
                      onClick={() => handleReview(c.id, "approved")}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm" disabled={loading[c.id]}
                      onClick={() => handleReview(c.id, "rejected")}>✕ Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                All certifications have been reviewed! 🎉
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
