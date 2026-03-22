import client from "./client";

export interface BlockedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  blocked_at: string;
}

export async function blockUser(username: string): Promise<void> {
  await client.post(`/api/blocks/${username}`);
}

export async function unblockUser(username: string): Promise<void> {
  await client.delete(`/api/blocks/${username}`);
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const res = await client.get<BlockedUser[]>("/api/blocks");
  return res.data;
}
