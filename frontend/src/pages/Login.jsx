import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const roleRoutes = {
        student: "/dashboard",
        faculty: "/faculty",
        recruiter: "/recruiter",
        admin: "/admin",
      };
      navigate(roleRoutes[user.role] || "/dashboard");
    }
  }, [user, navigate]);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "student", department: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

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

        <button className="btn btn-secondary" onClick={handleGoogleLogin} 
          style={{ width: "100%", marginBottom: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.996 8.996 0 000 8.088l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, color: "var(--text-muted)", fontSize: "0.8rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}></div>
          OR
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}></div>
        </div>

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
