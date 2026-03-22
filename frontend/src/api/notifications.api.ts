import client from "./client";

export type NotificationType =
  | "new_question"
  | "new_like"
  | "new_comment"
  | "new_reply"
  | "new_follower"
  | "new_answer"
  | "new_dm"
  | "follow_request";

export interface Notification {
  id: string;
  type: NotificationType;
  reference_id: string;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
}

export async function getNotifications(
  unreadOnly = false
): Promise<Notification[]> {
  const res = await client.get<Notification[]>("/api/notifications", {
    params: unreadOnly ? { unread_only: true } : {},
  });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await client.get<{ count: number }>(
    "/api/notifications/unread-count"
  );
  return res.data.count;
}

export async function markAllRead(): Promise<void> {
  await client.patch("/api/notifications/read-all");
}

export async function markRead(id: string): Promise<void> {
  await client.patch(`/api/notifications/${id}/read`);
}

export async function deleteNotification(id: string): Promise<void> {
  await client.delete(`/api/notifications/${id}`);
}
