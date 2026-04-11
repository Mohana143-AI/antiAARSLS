import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    department: user?.department || "",
  });

  const verificationUrl = `${window.location.origin}/verify/${user?.id}`;

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updatedUser = await authAPI.updateMe(form);
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your account details and verification identity.</p>
      </div>

      <div className="grid-2">
        {/* Left: Details */}
        <div className="card glass">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.2rem' }}>Personal Information</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {error && <div className="badge badge-rejected" style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div className="badge badge-approved" style={{ marginBottom: 16 }}>{success}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label>Full Name</label>
              {editing ? (
                <input className="form-input" value={form.full_name} 
                  onChange={(e) => setForm({...form, full_name: e.target.value})} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user.full_name}</p>
                  {user.is_trusted && (
                    <span className="badge badge-approved" title="Verified Trusted Peer" style={{ fontSize: '0.65rem' }}>
                      🛡️ Trusted Peer
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <p style={{ color: "var(--text-secondary)" }}>{user.email}</p>
            </div>

            <div className="form-group">
              <label>Department</label>
              {editing ? (
                <input className="form-input" value={form.department} 
                  onChange={(e) => setForm({...form, department: e.target.value})} />
              ) : (
                <p>{user.department || "Not set"}</p>
              )}
            </div>

            <div className="form-group">
              <label>System Role</label>
              <span className="badge badge-accent">{user.role}</span>
            </div>

            {editing && (
              <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 8 }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        {/* Right: QR Verification */}
        <div className="card glass" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>✨ Smart QR Identity</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 24, padding: "0 20px" }}>
            Recruiters and Faculty can scan this code to verify your Aura Ledger profile and reputation instantly.
          </p>
          
          <div style={{ 
            background: "white", 
            padding: 16, 
            borderRadius: "var(--radius-lg)", 
            boxShadow: "var(--shadow-lg)",
            marginBottom: 20
          }}>
            <QRCodeSVG value={verificationUrl} size={180} />
          </div>

          <div className="badge badge-info" style={{ marginBottom: 16 }}>
             Scan to Verify
          </div>
          
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
            {verificationUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
