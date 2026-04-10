import { useState, useEffect } from "react";
import { studentAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

function ScoreGauge({ score, max = 100 }) {
  const pct = Math.min(score / max, 1);
  const r = 68, c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="score-ring">
      <svg width="160" height="160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="url(#grad)" strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(250,90%,65%)" />
            <stop offset="100%" stopColor="hsl(200,85%,55%)" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div className="value">{score?.toFixed(1) ?? "–"}</div>
        <div className="label">Reputation</div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [reputation, setReputation] = useState(null);
  const [history, setHistory] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    studentAPI.getReputation().then(setReputation).catch(() => {});
    studentAPI.getReputationHistory().then(setHistory).catch(() => {});
    studentAPI.getSkills().then(setSkills).catch(() => {});
    studentAPI.getProjects().then(setProjects).catch(() => {});
    studentAPI.getCertifications().then(setCerts).catch(() => {});
  }, []);

  const radarData = reputation ? [
    { subject: "Skills", A: reputation.skill_score },
    { subject: "Projects", A: reputation.project_score },
    { subject: "Certificates", A: reputation.certification_score },
    { subject: "Peer Review", A: reputation.validation_score },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.full_name?.split(" ")[0]} 👋</h1>
        <p>Your academic reputation overview</p>
      </div>

      {/* Score & Radar */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <ScoreGauge score={reputation?.total_score || 0} />
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>BREAKDOWN</div>
            {[
              { label: "Skills", val: reputation?.skill_score, color: "var(--accent)" },
              { label: "Projects", val: reputation?.project_score, color: "var(--info)" },
              { label: "Certificates", val: reputation?.certification_score, color: "var(--success)" },
              { label: "Peer Review", val: reputation?.validation_score, color: "var(--warning)" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", width: 90 }}>{s.label}</span>
                <span style={{ fontWeight: 700 }}>{s.val?.toFixed(1) ?? "–"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>SKILL RADAR</div>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="A" stroke="hsl(250,90%,65%)" fill="hsl(250,90%,65%)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* History chart */}
      {history.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>REPUTATION TREND</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(250,90%,65%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(250,90%,65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="snapshot_date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="total_score" stroke="hsl(250,90%,65%)" fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>🎯</div>
          <div className="stat-value">{skills.length}</div>
          <div className="stat-label">Skills</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--info-bg)", color: "var(--info)" }}>🚀</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>📜</div>
          <div className="stat-value">{certs.filter(c => c.verification_status === "approved").length}</div>
          <div className="stat-label">Verified Certs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>⏳</div>
          <div className="stat-value">{certs.filter(c => c.verification_status === "pending").length}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>
    </div>
  );
}
