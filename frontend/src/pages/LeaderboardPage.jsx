import { useState, useEffect } from "react";
import { studentAPI } from "../lib/api";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    studentAPI.getLeaderboard().then(setData).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top students ranked by automated reputation score</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {data
          .filter(item => item.profiles?.role === 'student')
          .map((item, i) => {
            const profile = item.profiles || {};
          const rank = i + 1;
          return (
            <div key={item.student_id} className="leaderboard-item"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className={`leaderboard-rank ${rank <= 3 ? `rank-${rank}` : ""}`}
                style={rank > 3 ? { background: "var(--bg-secondary)", color: "var(--text-secondary)" } : {}}>
                {rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{profile.full_name || "Student"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{profile.department || ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: "1.3rem", fontWeight: 800,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {item.total_score?.toFixed(1)}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>SCORE</div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            No leaderboard data yet.
          </div>
        )}
      </div>
    </div>
  );
}
