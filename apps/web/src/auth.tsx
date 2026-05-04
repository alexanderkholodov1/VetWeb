import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  open: boolean;
  setOpen: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { fullName: string; email: string; password: string; role: string; sector?: string }) => Promise<void>;
  logout: () => void;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const STORAGE_KEY = "vetweb-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
    setUser(parsed.user);
    setToken(parsed.token);
  }, []);

  const persist = (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error("No se pudo iniciar sesión");
    const data = await response.json();
    persist(data.user, data.accessToken);
    setOpen(false);
  };

  const register = async (payload: { fullName: string; email: string; password: string; role: string; sector?: string }) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("No se pudo crear la cuenta");
    const data = await response.json();
    persist(data.user, data.accessToken);
    setOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, token, open, setOpen, login, register, logout }),
    [user, token, open]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}