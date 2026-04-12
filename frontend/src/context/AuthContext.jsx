import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../lib/api";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for existing session in localStorage (Email/Password)
      const token = localStorage.getItem("access_token");
      
      // 2. Clear tokens if it's an OAuth redirect return
      // (Supabase JS client will handle the new session from the URL)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Sync Supabase session to our app's storage
        localStorage.setItem("access_token", session.access_token);
        localStorage.setItem("refresh_token", session.refresh_token);
      }

      const currentToken = localStorage.getItem("access_token");
      if (currentToken) {
        try {
          const profile = await authAPI.me();
          setUser(profile);
        } catch (err) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for Auth changes (including OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        localStorage.setItem("access_token", session.access_token);
        localStorage.setItem("refresh_token", session.refresh_token);
        const profile = await authAPI.me();
        setUser(profile);
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("refresh_token", res.refresh_token);
    const profile = await authAPI.me();
    setUser(profile);
    return profile;
  };

  const signup = async (data) => {
    await authAPI.signup(data);
    return login(data.email, data.password);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
