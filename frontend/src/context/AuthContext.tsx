import { useState, useCallback, useEffect } from "react";
import {
  getToken,
  getUser,
  saveAuth,
  clearAuth,
  type StoredUser,
} from "@/lib/auth";
import { AuthContext } from "./auth-context";
import client from "@/api/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUser] = useState<StoredUser | null>(getUser);

  // Refresh user data on mount so role changes by admins are reflected
  // without requiring the user to log out and back in.
  useEffect(() => {
    if (!token) return;
    client
      .get<StoredUser>("/api/users/me")
      .then((res) => {
        const fresh = {
          ...res.data,
          email: res.data.email ?? user?.email ?? "",
        };
        saveAuth(token, fresh);
        setUser(fresh);
      })
      .catch(() => {}); // silent — stale localStorage data still works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback((tok: string, u: StoredUser) => {
    saveAuth(tok, u);
    setToken(tok);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext
      value={{ token, user, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext>
  );
}
