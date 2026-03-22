import client from './client';

export interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export async function followUser(username: string): Promise<void> {
  await client.post(`/api/follows/${username}`);
}

export async function unfollowUser(username: string): Promise<void> {
  await client.delete(`/api/follows/${username}`);
}

export async function getFollowers(username: string): Promise<FollowUser[]> {
  const res = await client.get<FollowUser[]>(`/api/follows/${username}/followers`);
  return res.data;
}

export async function getFollowing(username: string): Promise<FollowUser[]> {
  const res = await client.get<FollowUser[]>(`/api/follows/${username}/following`);
  return res.data;
}
