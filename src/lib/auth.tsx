"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SPUser {
  id: string;
  full_name: string;
  email: string;
  admin_id: string;
  batch?: string;
  college?: string;
  access_token: string;
}

interface AuthCtx {
  user: SPUser | null;
  loading: boolean;
  setUser: (u: SPUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true, setUser: () => {}, logout: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SPUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sp_user_v4");
      if (stored) setUserState(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const setUser = (u: SPUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("sp_user_v4", JSON.stringify(u));
    else localStorage.removeItem("sp_user_v4");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
