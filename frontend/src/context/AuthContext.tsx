import { useState, useCallback } from 'react';
import { getToken, getUser, saveAuth, clearAuth, type StoredUser } from '@/lib/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUser] = useState<StoredUser | null>(getUser);

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
    <AuthContext value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext>
  );
}
