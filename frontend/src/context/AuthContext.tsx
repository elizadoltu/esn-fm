import { createContext, useContext, useState, useCallback } from 'react';
import { getToken, getUser, saveAuth, clearAuth, type StoredUser } from '@/lib/auth';

interface AuthContextValue {
  token: string | null;
  user: StoredUser | null;
  login: (token: string, user: StoredUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
