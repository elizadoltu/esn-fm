import client from "./client";

export interface DailyQuestion {
  id: string;
  content: string;
  published_at: string;
  my_answer: DailyQAnswer | null;
}

export interface DailyQAnswer {
  id: string;
  content: string;
  show_on_feed: boolean;
  created_at: string;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string;
  likes: number;
  liked_by_me: boolean;
  comment_count: number;
}

export interface DailyQComment {
  id: string;
  content: string;
  created_at: string;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string;
}

// Admin types
export interface AdminDailyQuestion {
  id: string;
  content: string;
  is_active: boolean;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  created_by_username: string | null;
  answer_count: number;
}

export async function getActiveDailyQuestion(): Promise<DailyQuestion | null> {
  const res = await client.get<DailyQuestion | null>(
    "/api/daily-question/active"
  );
  return res.data;
}

export async function getDailyQAnswers(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: DailyQAnswer[]; limit: number; offset: number }> {
  const res = await client.get("/api/daily-question/active/answers", {
    params,
  });
  return res.data;
}

export async function submitDailyQAnswer(
  questionId: string,
  body: { content: string; show_on_feed?: boolean }
): Promise<DailyQAnswer> {
  const res = await client.post(
    `/api/daily-question/${questionId}/answer`,
    body
  );
  return res.data;
}

export async function toggleDailyQLike(
  answerId: string
): Promise<{ liked: boolean }> {
  const res = await client.post(`/api/daily-question/answers/${answerId}/like`);
  return res.data;
}

export async function getDailyQComments(
  answerId: string
): Promise<DailyQComment[]> {
  const res = await client.get(
    `/api/daily-question/answers/${answerId}/comments`
  );
  return res.data;
}

export async function postDailyQComment(
  answerId: string,
  content: string
): Promise<DailyQComment> {
  const res = await client.post(
    `/api/daily-question/answers/${answerId}/comments`,
    { content }
  );
  return res.data;
}

export interface ArchivedDailyQuestion {
  id: string;
  content: string;
  published_at: string;
  answer_count: number;
}

export interface DailyQDetail {
  id: string;
  content: string;
  published_at: string;
  is_active: boolean;
  answer_count: number;
}

export interface UserDailyQAnswer {
  id: string;
  content: string;
  show_on_feed: boolean;
  created_at: string;
  daily_question_id: string;
  question: string;
  published_at: string;
  likes: number;
  liked_by_me: boolean;
  comment_count: number;
}

export async function getDailyQArchive(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: ArchivedDailyQuestion[]; limit: number; offset: number }> {
  const res = await client.get("/api/daily-question/archive", { params });
  return res.data;
}

export async function getDailyQById(id: string): Promise<DailyQDetail> {
  const res = await client.get(`/api/daily-question/${id}`);
  return res.data;
}

export async function getDailyQAnswersById(
  id: string,
  params?: { limit?: number; offset?: number }
): Promise<{ items: DailyQAnswer[]; limit: number; offset: number }> {
  const res = await client.get(`/api/daily-question/${id}/answers`, { params });
  return res.data;
}

export async function getUserDailyQAnswers(
  username: string
): Promise<UserDailyQAnswer[]> {
  const res = await client.get(`/api/daily-question/user/${username}`);
  return res.data;
}

// Admin
export async function adminListDailyQuestions(params?: {
  limit?: number;
  offset?: number;
}): Promise<{
  questions: AdminDailyQuestion[];
  total: number;
  limit: number;
  offset: number;
}> {
  const res = await client.get("/api/admin/daily-questions", { params });
  return res.data;
}

export async function adminCreateDailyQuestion(body: {
  content: string;
  scheduled_for?: string;
}): Promise<AdminDailyQuestion> {
  const res = await client.post("/api/admin/daily-questions", body);
  return res.data;
}

export async function adminPublishDailyQuestion(
  id: string
): Promise<AdminDailyQuestion> {
  const res = await client.patch(`/api/admin/daily-questions/${id}/publish`);
  return res.data;
}

export async function adminArchiveDailyQuestion(
  id: string
): Promise<{ id: string; is_active: boolean }> {
  const res = await client.patch(`/api/admin/daily-questions/${id}/archive`);
  return res.data;
}
