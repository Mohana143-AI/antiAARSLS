import { useState, useEffect } from "react";
import { adminAPI } from "../lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [tableFilter, setTableFilter] = useState("");

  const load = () => {
    const params = {};
    if (tableFilter) params.table_name = tableFilter;
    adminAPI.getAuditLogs(params).then(setLogs).catch(() => {});
  };
  useEffect(load, [tableFilter]);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>📋 Audit Logs</h1>
          <p>Complete trail of all data modifications in the system</p>
        </div>
        <select className="form-select" style={{ width: 180 }} value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}>
          <option value="">All Tables</option>
          <option value="skills">Skills</option>
          <option value="projects">Projects</option>
          <option value="certifications">Certifications</option>
          <option value="validations">Validations</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className={`badge ${
                    log.action === "INSERT" ? "badge-approved" :
                    log.action === "UPDATE" ? "badge-pending" : "badge-rejected"
                  }`}>{log.action}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{log.table_name}</td>
                <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {log.record_id?.slice(0, 8)}…
                </td>
                <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {log.new_data ? JSON.stringify(log.new_data).slice(0, 60) + "…" : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
