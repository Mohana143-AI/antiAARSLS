import { useState, useEffect } from "react";
import { studentAPI, uploadFile } from "../lib/api";

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", proficiency_level: 3, proof_url: "" });
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => studentAPI.getSkills().then(setSkills).catch(() => {});
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
      
      await studentAPI.addSkill({ ...form, proof_url: uploadedUrl, image_hash: imgHash });
      setShowForm(false);
      setForm({ name: "", category: "", proficiency_level: 3, proof_url: "", image_hash: "" });
      setProofFile(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this skill?")) {
      await studentAPI.deleteSkill(id);
      load();
    }
  };

  const categories = ["Programming", "Design", "Communication", "Data Science", "DevOps", "Management", "Other"];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>My Skills</h1>
          <p>Manage your skill portfolio — each skill contributes to your reputation score automatically</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Skill</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2>Add New Skill</h2>
            {error && <div style={{ color: "var(--danger)", marginBottom: 12, fontSize: "0.85rem" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Skill Name</label>
                <input className="form-input" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React, Python" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Proficiency Level: {form.proficiency_level}/5</label>
                <input type="range" min="1" max="5" value={form.proficiency_level}
                  onChange={(e) => setForm({ ...form, proficiency_level: parseInt(e.target.value) })}
                  style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>Beginner</span><span>Intermediate</span><span>Expert</span>
                </div>
              </div>
              <div className="form-group">
                <label>Proof Image (Optional)</label>
                <input className="form-input" type="file" accept="image/*"
                  onChange={(e) => setProofFile(e.target.files[0])} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Add Skill"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)} disabled={uploading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid-3">
        {skills.map((skill) => (
          <div key={skill.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>{skill.name}</h3>
                <span className="badge badge-accent">{skill.category}</span>
                {skill.proof_url && (
                  <a href={skill.proof_url} target="_blank" rel="noopener noreferrer" className="badge badge-info" style={{ marginLeft: 8, textDecoration: "none" }}>
                    🖼️ Proof
                  </a>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(skill.id)}
                style={{ color: "var(--danger)" }}>✕</button>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                Proficiency Level
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    width: "100%", height: 6, borderRadius: 3,
                    background: i <= skill.proficiency_level
                      ? "linear-gradient(90deg, hsl(250,90%,65%), hsl(200,85%,55%))"
                      : "var(--border)"
                  }} />
                ))}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                Level {skill.proficiency_level}/5
              </div>
            </div>
          </div>
        ))}
        {skills.length === 0 && (
          <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>🎯</p>
            <p>No skills added yet. Click "+ Add Skill" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
