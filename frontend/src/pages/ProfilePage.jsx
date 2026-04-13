import { useState, useEffect } from "react";
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
    full_name: "",
    department: "",
    role: "student",
  });
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Ensure form is updated when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        department: user.department || "",
        role: user.role || "student",
      });

      // Fetch activity for non-students
      if (user.role !== 'student') {
        setLoadingActivity(true);
        authAPI.getMyActivity()
          .then(setActivities)
          .catch(console.error)
          .finally(() => setLoadingActivity(false));
      }
    }
  }, [user, editing]); // Also reset on editing toggle if cancelled

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
              {editing ? (
                <select className="form-input" value={form.role} 
                  onChange={(e) => setForm({...form, role: e.target.value})}>
                  <option value="student">student</option>
                  <option value="faculty">faculty</option>
                  <option value="recruiter">recruiter</option>
                  <option value="admin">admin</option>
                </select>
              ) : (
                <span className="badge badge-accent">{user.role}</span>
              )}
            </div>

            {editing && (
              <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 8 }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        {/* Right: QR Verification (Students only) */}
        {(user.role || '').toLowerCase().trim() === 'student' ? (
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
        ) : (
          <div className="card glass" style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>📜 Quick Activity Log</h2>
            
            {loadingActivity ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading activity...</p>
            ) : activities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activities.map((act) => (
                  <div key={act.id} style={{ 
                    padding: "10px 14px", 
                    background: "var(--bg-secondary)", 
                    borderRadius: "var(--radius-md)",
                    borderLeft: `4px solid ${
                      act.action === 'INSERT' ? 'var(--success)' : 
                      act.action === 'UPDATE' ? 'var(--info)' : 'var(--danger)'
                    }`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-light)" }}>
                        {act.action}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", margin: 0 }}>
                      Modified <strong style={{ color: "var(--text-secondary)" }}>{act.table_name}</strong>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.7 }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No recent activity found.</p>
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                As a <strong>{user.role}</strong>, your administrative actions are logged for audit purposes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
