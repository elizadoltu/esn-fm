import client from "./client";

export interface DmMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
  unread_count: number;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await client.get<Conversation[]>("/api/dm");
  return res.data;
}

export async function getMessages(
  username: string,
  params: { limit?: number; offset?: number } = {}
): Promise<{ messages: DmMessage[]; limit: number; offset: number }> {
  const res = await client.get(`/api/dm/${username}`, { params });
  return res.data;
}

export async function sendDm(data: {
  recipient_username: string;
  content: string;
}): Promise<DmMessage> {
  const res = await client.post<DmMessage>("/api/dm", data);
  return res.data;
}
