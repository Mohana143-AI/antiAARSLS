import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "student", department: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (isSignup) {
        user = await signup(form);
      } else {
        user = await login(form.email, form.password);
      }
      const roleRoutes = {
        student: "/dashboard",
        faculty: "/faculty",
        recruiter: "/recruiter",
        admin: "/admin",
      };
      navigate(roleRoutes[user.role] || "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2rem' }}>✨</span> Aura Ledger
        </h1>
        <p className="subtitle">Secure Academic Proof & Verified Reputation Ledger</p>

        {error && (
          <div style={{
            background: "var(--danger-bg)", color: "var(--danger)",
            padding: "10px 14px", borderRadius: "var(--radius-md)",
            marginBottom: 16, fontSize: "0.85rem"
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" name="full_name" value={form.full_name}
                  onChange={handleChange} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input className="form-input" name="department" value={form.department}
                  onChange={handleChange} placeholder="Computer Science" />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" name="email" value={form.email}
              onChange={handleChange} required placeholder="you@university.edu" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" name="password" value={form.password}
              onChange={handleChange} required placeholder="••••••••" minLength={6} />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={{ color: "var(--accent-light)", cursor: "pointer" }}
            onClick={() => { setIsSignup(!isSignup); setError(""); }}>
            {isSignup ? "Sign In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}
