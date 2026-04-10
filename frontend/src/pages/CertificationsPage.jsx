import { useState, useEffect } from "react";
import { studentAPI, uploadFile } from "../lib/api";

export default function CertificationsPage() {
  const [certs, setCerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", issue_date: "", expiry_date: "", credential_url: "", proof_url: "" });
  const [error, setError] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => studentAPI.getCertifications().then(setCerts).catch(() => {});
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
      
      await studentAPI.addCertification({ ...form, proof_url: uploadedUrl, image_hash: imgHash });
      setShowForm(false);
      setForm({ name: "", issuer: "", issue_date: "", expiry_date: "", credential_url: "", proof_url: "", image_hash: "" });
      setProofFile(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const statusColors = { pending: "badge-pending", approved: "badge-approved", rejected: "badge-rejected" };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Certifications</h1>
          <p>Only approved certificates contribute to your reputation score</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Upload Certificate</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2>Upload Certificate</h2>
            {error && <div style={{ color: "var(--danger)", marginBottom: 12, fontSize: "0.85rem" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Certificate Name</label>
                <input className="form-input" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AWS Solutions Architect" />
              </div>
              <div className="form-group">
                <label>Issuing Organization</label>
                <input className="form-input" value={form.issuer} required
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Amazon Web Services" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Issue Date</label>
                  <input className="form-input" type="date" value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input className="form-input" type="date" value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Credential URL</label>
                <input className="form-input" value={form.credential_url}
                  onChange={(e) => setForm({ ...form, credential_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Certificate Proof Image</label>
                <input className="form-input" type="file" accept="image/*" required
                  onChange={(e) => setProofFile(e.target.files[0])} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Required for faculty verification.</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Submit for Review"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)} disabled={uploading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Issuer</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.issuer}</td>
                <td>{c.issue_date || "—"}</td>
                <td><span className={`badge ${statusColors[c.verification_status]}`}>{c.verification_status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {c.credential_url ? <a href={c.credential_url} target="_blank" rel="noopener">Link</a> : "—"}
                    {c.proof_url && <a href={c.proof_url} target="_blank" rel="noopener">Proof</a>}
                  </div>
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No certifications uploaded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
