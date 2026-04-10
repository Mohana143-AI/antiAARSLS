import { useState, useEffect } from "react";
import { studentAPI, uploadFile } from "../lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", tech_stack: "", project_url: "",
    contribution_level: 3, team_size: 1, start_date: "", end_date: "", proof_url: ""
  });
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => studentAPI.getProjects().then(setProjects).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setUploading(true);
      let uploadedUrl = form.proof_url;
      let imgHash = form.image_hash;
      if (proofFile) {
        const uploadRes = await uploadFile(proofFile);
        uploadedUrl = uploadRes.proof_url;
        imgHash = uploadRes.image_hash;
      }
      
      await studentAPI.addProject({
        ...form,
        tech_stack: form.tech_stack.split(",").map(s => s.trim()).filter(Boolean),
        contribution_level: parseInt(form.contribution_level),
        team_size: parseInt(form.team_size),
        proof_url: uploadedUrl,
        image_hash: imgHash,
      });
      setShowForm(false);
      setForm({ title: "", description: "", tech_stack: "", project_url: "", contribution_level: 3, team_size: 1, start_date: "", end_date: "", proof_url: "", image_hash: "" });
      setProofFile(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>My Projects</h1>
          <p>Showcase your work — contribution level automatically affects your reputation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Project</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2>Add New Project</h2>
            {error && <div style={{ color: "var(--danger)", marginBottom: 12, fontSize: "0.85rem" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Title</label>
                <input className="form-input" value={form.title} required
                  onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E-Commerce Platform" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" />
              </div>
              <div className="form-group">
                <label>Tech Stack (comma separated)</label>
                <input className="form-input" value={form.tech_stack}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node.js, PostgreSQL" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Contribution Level: {form.contribution_level}/5</label>
                  <input type="range" min="1" max="5" value={form.contribution_level}
                    onChange={(e) => setForm({ ...form, contribution_level: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label>Team Size</label>
                  <input className="form-input" type="number" min="1" value={form.team_size}
                    onChange={(e) => setForm({ ...form, team_size: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Start Date</label>
                  <input className="form-input" type="date" value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input className="form-input" type="date" value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Project URL</label>
                <input className="form-input" value={form.project_url}
                  onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <div className="form-group">
                <label>Proof Image (Optional)</label>
                <input className="form-input" type="file" accept="image/*"
                  onChange={(e) => setProofFile(e.target.files[0])} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Add Project"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)} disabled={uploading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid-2">
        {projects.map((p) => (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <h3 style={{ fontSize: "1.1rem" }}>{p.title}</h3>
              {p.project_url && (
                <a href={p.project_url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm">🔗 Link</a>
              )}
              {p.proof_url && (
                <a href={p.proof_url} target="_blank" rel="noopener noreferrer"
                   className="btn btn-secondary btn-sm">🖼️ Proof</a>
              )}
            </div>
            {p.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 8 }}>{p.description}</p>}
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {(p.tech_stack || []).map(t => (
                <span key={t} className="badge badge-info">{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>👥 Team: {p.team_size}</span>
              <span>⚡ Contribution: {p.contribution_level}/5</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>🚀</p>
            <p>No projects added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
