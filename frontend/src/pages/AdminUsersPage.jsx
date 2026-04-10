import { useState, useEffect } from "react";
import { adminAPI } from "../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState("");

  const load = () => adminAPI.getUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleRoleUpdate = async (id) => {
    try {
      await adminAPI.updateRole(id, newRole);
      setEditingId(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await adminAPI.deleteUser(id);
        load();
      } catch (err) { alert(err.message); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage roles and user accounts</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Score</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                <td>
                  {editingId === u.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <select className="form-select" value={newRole}
                        onChange={(e) => setNewRole(e.target.value)} style={{ width: 120, padding: "4px 8px" }}>
                        <option value="student">student</option>
                        <option value="faculty">faculty</option>
                        <option value="recruiter">recruiter</option>
                        <option value="admin">admin</option>
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRoleUpdate(u.id)}>✓</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <span className="badge badge-accent">{u.role}</span>
                  )}
                </td>
                <td>{u.reputation_scores?.total_score?.toFixed(1) || "—"}</td>
                <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setEditingId(u.id); setNewRole(u.role); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
