import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currentUser, logout, type User } from "@/lib/authService";

type Auth = {
  user: User | null; loading: boolean; error: string;
  refresh: () => Promise<void>; signOut: () => Promise<void>;
};
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    setError("");
    try { setUser(await currentUser()); }
    catch { setUser(null); setError("Could not connect. Please try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function signOut() {
    await logout();
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, loading, error, refresh, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
}
