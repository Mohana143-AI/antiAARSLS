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
  ],
  faculty: [
    { to: "/faculty", icon: "📊", label: "Dashboard" },
    { to: "/faculty/certifications", icon: "✅", label: "Cert Approvals" },
    { to: "/faculty/students", icon: "👥", label: "Students" },
  ],
  recruiter: [
    { to: "/recruiter", icon: "🔍", label: "Search" },
  ],
  admin: [
    { to: "/admin", icon: "📊", label: "Dashboard" },
    { to: "/admin/users", icon: "👥", label: "Users" },
    { to: "/admin/audit", icon: "📋", label: "Audit Logs" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If there's no user, the ProtectedRoute wrapper handles the redirect.
  // We can safely render layout elements or a loading state.
  if (!user) return null;

  const navItems = navConfigs[user.role] || navConfigs.student;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">⚡ AARSLS</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0 8px", marginBottom: 8 }}>
          {user.full_name}
          <span className="badge badge-accent" style={{ marginLeft: 8 }}>{user.role}</span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="btn btn-secondary" onClick={handleLogout}
          style={{ marginTop: "auto", width: "100%" }}>
          🚪 Sign Out
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
