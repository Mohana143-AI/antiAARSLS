import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navConfigs = {
  student: [
    { to: "/dashboard", icon: "📊", label: "Dashboard" },
    { to: "/dashboard/skills", icon: "🎯", label: "My Skills" },
    { to: "/dashboard/projects", icon: "🚀", label: "My Projects" },
    { to: "/dashboard/certifications", icon: "📜", label: "Certifications" },
    { to: "/dashboard/leaderboard", icon: "🏆", label: "Leaderboard" },
    { to: "/dashboard/notifications", icon: "🔔", label: "Notifications" },
    { to: "/profile", icon: "👤", label: "Profile" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
  faculty: [
    { to: "/faculty", icon: "📊", label: "Dashboard" },
    { to: "/faculty/certifications", icon: "✅", label: "Cert Approvals" },
    { to: "/faculty/students", icon: "👥", label: "Students" },
    { to: "/profile", icon: "👤", label: "Profile" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
  recruiter: [
    { to: "/recruiter", icon: "🔍", label: "Search" },
    { to: "/profile", icon: "👤", label: "Profile" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
  admin: [
    { to: "/admin", icon: "📊", label: "Dashboard" },
    { to: "/admin/users", icon: "👥", label: "Users" },
    { to: "/admin/audit", icon: "📋", label: "Audit Logs" },
    { to: "/profile", icon: "👤", label: "Profile" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // If there's no user, the ProtectedRoute wrapper handles the redirect.
  if (!user) return null;

  const navItems = navConfigs[user.role] || navConfigs.student;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>✨</span> <span className="logo-text">Aura Ledger</span>
        </div>
        <div className="user-info" style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0 8px", marginBottom: 8 }}>
          <span className="nav-label">{user.full_name}</span>
          <span className="badge badge-accent" style={{ marginLeft: 8 }}>{user.role}</span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <span>{item.icon}</span> <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="nav-item" onClick={toggleTheme} style={{ background: "none", border: "none", width: "100%", justifyContent: "flex-start" }}>
            <span>{theme === "dark" ? "☀️" : "🌙"}</span> <span className="nav-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: "100%", padding: "10px" }}>
            🚪 <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>


      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
