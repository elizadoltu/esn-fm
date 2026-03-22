import client from './client';
import type { StoredUser } from '@/lib/auth';

export interface AuthResponse {
  token: string;
  user: StoredUser;
}

export async function register(data: {
  email: string;
  password: string;
  username: string;
  display_name: string;
  invite_code?: string;
}): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/api/auth/register', data);
  return res.data;
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/api/auth/login', data);
  return res.data;
}
