import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import StudentDashboard from "./pages/StudentDashboard";
import SkillsPage from "./pages/SkillsPage";
import ProjectsPage from "./pages/ProjectsPage";
import CertificationsPage from "./pages/CertificationsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotificationsPage from "./pages/NotificationsPage";
import FacultyDashboard from "./pages/FacultyDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AuditLogsPage from "./pages/AuditLogsPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Loading Session...</div>;
  }
  
  if (!user) {
    console.warn("ProtectedRoute: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`ProtectedRoute: Access denied for role ${user.role}, redirecting to login`);
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Student Pages */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="certifications" element={<CertificationsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Faculty Pages */}
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles={["faculty"]}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FacultyDashboard />} />
        <Route path="certifications" element={<FacultyDashboard />} />
        <Route path="students" element={<LeaderboardPage />} />
      </Route>

      {/* Recruiter Pages */}
      <Route path="/recruiter" element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RecruiterDashboard />} />
      </Route>

      {/* Admin Pages */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
      </Route>

      {/* Root Redirection */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.role === 'admin' ? '/admin' : 
            user.role === 'faculty' ? '/faculty' : 
            user.role === 'recruiter' ? '/recruiter' : 
            '/dashboard'
          } replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Wildcard Match */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
