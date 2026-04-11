import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Customize your Aura Ledger experience and security.</p>
      </div>

      <div className="grid-2">
        <div className="card glass">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Appearance</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontWeight: 600 }}>Theme Mode</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Switch between light and dark themes.</p>
            </div>
            <button className="btn btn-secondary" onClick={toggleTheme}>
              {theme === "dark" ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
            </button>
          </div>
        </div>

        <div className="card glass">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Account Security</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            Password reset and two-factor authentication features are coming soon.
          </p>
          <button className="btn btn-secondary btn-sm" disabled>Change Password</button>
        </div>

        <div className="card glass" style={{ borderColor: 'var(--danger-bg)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--danger)' }}>Session Management</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 24 }}>
            Safely sign out from the current device.
          </p>
          <button className="btn btn-danger" onClick={logout} style={{ width: "100%" }}>
            🚪 End Current Session
          </button>
        </div>
      </div>
    </div>
  );
}
