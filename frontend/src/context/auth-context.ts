import { createContext } from "react";
import type { StoredUser } from "@/lib/auth";

export interface AuthContextValue {
  token: string | null;
  user: StoredUser | null;
  login: (token: string, user: StoredUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
