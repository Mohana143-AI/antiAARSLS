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
      console.log("DEBUG Auth Event:", event);
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        console.log("DEBUG Session found, syncing tokens...");
        setLoading(true); // Lock the loading state while we fetch the profile
        
        localStorage.setItem("access_token", session.access_token);
        localStorage.setItem("refresh_token", session.refresh_token);
        
        try {
          console.log("DEBUG Fetching profile from backend...");
          const profile = await authAPI.me();
          console.log("DEBUG Profile fetched:", profile);
          setUser(profile);
        } catch (err) {
          console.error("DEBUG Profile fetch FAILED:", err.message);
          // Only alert if it's not a common initialization error
          if (!err.message.includes("401") && !err.message.includes("404")) {
            alert("Connection Error: " + err.message);
          }
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        } finally {
          setLoading(false); // Unlock the UI after fetch attempt
        }
      } else if (event === "SIGNED_OUT") {
        console.log("DEBUG User signed out");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        setLoading(false);
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
