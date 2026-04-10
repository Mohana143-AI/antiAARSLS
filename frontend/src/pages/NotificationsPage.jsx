import { useState, useEffect } from "react";
import { studentAPI } from "../lib/api";

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);

  const load = () => studentAPI.getNotifications().then(setNotifs).catch(() => {});
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await studentAPI.markRead(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <p>Stay updated on certification reviews and peer validations</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {notifs.map((n) => (
          <div key={n.id} style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border)",
            background: n.is_read ? "transparent" : "var(--accent-bg)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{n.title}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>{n.message}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            {!n.is_read && (
              <button className="btn btn-secondary btn-sm" onClick={() => markRead(n.id)}>Mark Read</button>
            )}
          </div>
        ))}
        {notifs.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
