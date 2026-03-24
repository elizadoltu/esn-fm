import client from "./client";

export interface Question {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  is_answered: boolean;
  created_at: string;
}

export async function sendQuestion(data: {
  recipient_username: string;
  content: string;
  sender_name?: string;
  show_in_feed?: boolean;
}): Promise<Question> {
  const res = await client.post<Question>("/api/questions", data);
  return res.data;
}

export async function getInbox(): Promise<Question[]> {
  const res = await client.get<Question[]>("/api/questions/inbox");
  return res.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await client.delete(`/api/questions/${id}`);
}

export async function archiveQuestion(
  id: string
): Promise<{ id: string; is_archived: boolean }> {
  const res = await client.patch<{ id: string; is_archived: boolean }>(
    `/api/questions/${id}/archive`
  );
  return res.data;
}
