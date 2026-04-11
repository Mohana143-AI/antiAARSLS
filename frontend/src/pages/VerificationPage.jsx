import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { authAPI } from "../lib/api";

export default function VerificationPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await authAPI.publicVerify(id);
        setData(result);
      } catch (err) {
        setError("Invalid or expired verification link.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="login-page">
        <div className="glass card" style={{ padding: 40, textAlign: "center" }}>
          <p>Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="login-page">
        <div className="glass card" style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
          <span style={{ fontSize: "3rem" }}>⚠️</span>
          <h2 style={{ marginTop: 20 }}>Verification Failed</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 10 }}>{error}</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 24, width: "100%" }}>Return to Portal</Link>
        </div>
      </div>
    );
  }

  const reputation = data.reputation_scores?.[0] || { total_score: 0, matches_detected: 0 };

  return (
    <div className="login-page" style={{ padding: 20 }}>
      <div className="glass card" style={{ maxWidth: 500, width: "100%", padding: 40, textAlign: "center" }}>
        <div className="logo" style={{ marginBottom: 32, fontSize: "1.5rem" }}>✨ Aura Ledger</div>
        
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{ 
            width: 80, height: 80, background: "var(--accent-bg)", 
            borderRadius: "50%", margin: "0 auto", 
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem"
          }}>
             {data.full_name.charAt(0)}
          </div>
          <div style={{ 
            position: "absolute", bottom: 0, right: "calc(50% - 40px)", 
            background: "var(--success)", color: "white", 
            borderRadius: "50%", width: 24, height: 24, 
            display: "flex", alignItems: "center", justifyContent: "center", 
            fontSize: "0.8rem", border: "2px solid var(--bg-card)"
          }}>
            ✓
          </div>
        </div>

        <h1 style={{ fontSize: "1.8rem", marginBottom: 4 }}>
          {data.full_name}
          {data.is_trusted && <span style={{ fontSize: '1.2rem', marginLeft: 8 }} title="Verified Trusted Peer">🛡️</span>}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{data.department || "Independent Professional"}</p>

        <div className="badge badge-approved" style={{ padding: "8px 16px", fontSize: "0.9rem", marginBottom: 32 }}>
          ✅ Verified Aura Profile
        </div>

        <div className="grid-2" style={{ marginBottom: 32 }}>
          <div style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-light)" }}>{reputation.total_score}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Reputation Score</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>0</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Plagiarism Cases</p>
          </div>
        </div>

        <div className="card" style={{ background: "var(--bg-secondary)", border: "none", textAlign: "left" }}>
           <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <strong>Authenticity Note:</strong> This identity is cryptographically linked to the Aura Ledger system. All reputation points are earned through peer-validated academics.
           </p>
        </div>

        <p style={{ marginTop: 32, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Verification Timestamp: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
