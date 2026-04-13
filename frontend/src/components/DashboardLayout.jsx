import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Target, Rocket, Award, Trophy, 
  Bell, User, Settings, LogOut, Sun, Moon 
} from "lucide-react";

const navConfigs = {
  student: [
    { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/dashboard/skills", icon: <Target size={18} />, label: "My Skills" },
    { to: "/dashboard/projects", icon: <Rocket size={18} />, label: "My Projects" },
    { to: "/dashboard/certifications", icon: <Award size={18} />, label: "Certifications" },
    { to: "/dashboard/leaderboard", icon: <Trophy size={18} />, label: "Leaderboard" },
    { to: "/dashboard/notifications", icon: <Bell size={18} />, label: "Notifications" },
    { to: "/profile", icon: <User size={18} />, label: "Profile" },
    { to: "/settings", icon: <Settings size={18} />, label: "Settings" },
  ],
  faculty: [
    { to: "/faculty", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/faculty/certifications", icon: <Award size={18} />, label: "Cert Approvals" },
    { to: "/faculty/students", icon: <Trophy size={18} />, label: "Students" },
    { to: "/profile", icon: <User size={18} />, label: "Profile" },
    { to: "/settings", icon: <Settings size={18} />, label: "Settings" },
  ],
  recruiter: [
    { to: "/recruiter", icon: <Target size={18} />, label: "Search" },
    { to: "/profile", icon: <User size={18} />, label: "Profile" },
    { to: "/settings", icon: <Settings size={18} />, label: "Settings" },
  ],
  admin: [
    { to: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/admin/users", icon: <Trophy size={18} />, label: "Users" },
    { to: "/admin/audit", icon: <Award size={18} />, label: "Audit Logs" },
    { to: "/profile", icon: <User size={18} />, label: "Profile" },
    { to: "/settings", icon: <Settings size={18} />, label: "Settings" },
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
            <span>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</span> <span className="nav-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: "100%", padding: "10px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogOut size={18} /> <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>


      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
