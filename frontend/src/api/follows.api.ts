import client from "./client";

export interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export async function followUser(
  username: string
): Promise<{ following: boolean; pending: boolean }> {
  const res = await client.post<{ following: boolean; pending: boolean }>(
    `/api/follows/${username}`
  );
  return res.data;
}

export async function unfollowUser(username: string): Promise<void> {
  await client.delete(`/api/follows/${username}`);
}

export async function getFollowRequests(): Promise<FollowUser[]> {
  const res = await client.get<FollowUser[]>("/api/follows/requests");
  return res.data;
}

export async function approveFollowRequest(username: string): Promise<void> {
  await client.patch(`/api/follows/requests/${username}/approve`);
}

export async function declineFollowRequest(username: string): Promise<void> {
  await client.delete(`/api/follows/requests/${username}/decline`);
}

export async function getFollowers(username: string): Promise<FollowUser[]> {
  const res = await client.get<FollowUser[]>(
    `/api/follows/${username}/followers`
  );
  return res.data;
}

export async function getFollowing(username: string): Promise<FollowUser[]> {
  const res = await client.get<FollowUser[]>(
    `/api/follows/${username}/following`
  );
  return res.data;
}

export interface SuggestionUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_private: boolean;
  mutual_followers: number;
}

export async function getSuggestions(): Promise<SuggestionUser[]> {
  const res = await client.get<SuggestionUser[]>("/api/users/suggestions");
  return res.data;
}
