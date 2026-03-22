import client from "./client";

export interface Profile {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  location: string | null;
  website: string | null;
  allow_anonymous_questions: boolean;
  is_private: boolean;
  role: "user" | "moderator" | "admin";
  follower_count: number;
  following_count: number;
  answer_count: number;
  is_following: boolean;
  is_pending: boolean;
  created_at: string;
}

export async function getProfile(username: string): Promise<Profile> {
  const res = await client.get<Profile>(`/api/users/${username}`);
  return res.data;
}

export async function getMe(): Promise<Profile> {
  const res = await client.get<Profile>("/api/users/me");
  return res.data;
}

export async function updateProfile(
  data: Partial<{
    display_name: string;
    bio: string;
    avatar_url: string;
    cover_image_url: string;
    location: string | null;
    website: string | null;
    allow_anonymous_questions: boolean;
    is_private: boolean;
  }>
): Promise<Profile> {
  const res = await client.patch<Profile>("/api/users/me", data);
  return res.data;
}

export async function deleteAccount(): Promise<void> {
  await client.delete('/api/users/me');
}
