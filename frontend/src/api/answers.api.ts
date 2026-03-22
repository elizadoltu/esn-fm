import client from "./client";

export interface FeedItem {
  question_id: string;
  question: string;
  sender_name: string | null;
  asked_at: string;
  answer_id: string;
  answer: string;
  answered_at: string;
  likes: number;
  liked_by_me: boolean;
}

export interface FeedResponse {
  items: FeedItem[];
  limit: number;
  offset: number;
}

export async function getFeed(
  username: string,
  params: { limit?: number; offset?: number } = {}
): Promise<FeedResponse> {
  const res = await client.get<FeedResponse>(`/api/answers/${username}`, {
    params,
  });
  return res.data;
}

export async function postAnswer(data: {
  question_id: string;
  content: string;
}): Promise<void> {
  await client.post("/api/answers", data);
}

export async function deleteAnswer(id: string): Promise<void> {
  await client.delete(`/api/answers/${id}`);
}

export async function toggleLike(
  answerId: string
): Promise<{ liked: boolean }> {
  const res = await client.post<{ liked: boolean }>(
    `/api/answers/${answerId}/like`
  );
  return res.data;
}
