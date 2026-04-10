import { useState, useEffect } from "react";
import { recruiterAPI } from "../lib/api";

export default function RecruiterDashboard() {
  const [results, setResults] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ q: "", skill: "", department: "", min_score: "" });

  useEffect(() => {
    recruiterAPI.getDepartments().then(setDepartments).catch(() => {});
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      const res = await recruiterAPI.search(filters);
      setResults(res);
    } catch (err) { console.error(err); }
  };

  const viewStudent = async (id) => {
    try {
      const data = await recruiterAPI.getStudent(id);
      setSelectedStudent(data);
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Talent Search</h1>
        <p>Find top students by skills, department, or reputation score</p>
      </div>

      {/* Search Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input className="form-input" value={filters.q} placeholder="Search by name…"
              onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Skill</label>
            <input className="form-input" value={filters.skill} placeholder="e.g. React"
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Department</label>
            <select className="form-select" value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
              <option value="">All</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Min Score</label>
            <input className="form-input" type="number" value={filters.min_score} placeholder="0"
              onChange={(e) => setFilters({ ...filters, min_score: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSearch}>Search</button>
      </div>

      {/* Results */}
      <div className="grid-3">
        {results.map((r) => {
          const score = r.reputation_scores?.total_score || 0;
          return (
            <div key={r.id} className="card" style={{ cursor: "pointer" }} onClick={() => viewStudent(r.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>{r.full_name}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{r.department || "Undeclared"}</div>
                </div>
                <div style={{
                  fontSize: "1.2rem", fontWeight: 800,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{score.toFixed(1)}</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Score Breakdown</div>
                {["skill_score", "project_score", "certification_score", "validation_score"].map(key => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <div style={{
                      flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${(r.reputation_scores?.[key] || 0)}%`, height: "100%",
                        background: "var(--accent)", borderRadius: 2,
                      }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", width: 30 }}>
                      {(r.reputation_scores?.[key] || 0).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {results.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          No students found. Try adjusting your filters.
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedStudent(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <h2>{selectedStudent.profile?.full_name}</h2>
            <div style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              {selectedStudent.profile?.department} · {selectedStudent.profile?.email}
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div className="stat-card" style={{ flex: 1, textAlign: "center" }}>
                <div className="stat-value" style={{ color: "var(--accent)" }}>
                  {selectedStudent.reputation?.total_score?.toFixed(1) || "–"}
                </div>
                <div className="stat-label">Overall Score</div>
              </div>
            </div>

            <h3 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Skills ({selectedStudent.skills?.length || 0})</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {selectedStudent.skills?.map(s => (
                <span key={s.id} className="badge badge-accent">{s.name} · Lv{s.proficiency_level}</span>
              ))}
            </div>

            <h3 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Projects ({selectedStudent.projects?.length || 0})</h3>
            {selectedStudent.projects?.map(p => (
              <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 600 }}>{p.title}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>Contribution: {p.contribution_level}/5</span>
              </div>
            ))}

            <h3 style={{ fontSize: "0.9rem", margin: "16px 0 8px" }}>
              Verified Certifications ({selectedStudent.certifications?.length || 0})
            </h3>
            {selectedStudent.certifications?.map(c => (
              <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>by {c.issuer}</span>
              </div>
            ))}

            <button className="btn btn-secondary" style={{ marginTop: 20 }}
              onClick={() => setSelectedStudent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
