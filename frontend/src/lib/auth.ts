const TOKEN_KEY = "esn_fm_token";
const USER_KEY = "esn_fm_user";

export interface StoredUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  location: string | null;
  website: string | null;
  allow_anonymous_questions: boolean;
  is_private: boolean;
  role: "user" | "moderator" | "admin";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
