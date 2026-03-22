import client from "./client";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  role: "user" | "moderator" | "admin";
  is_private: boolean;
  created_at: string;
  answer_count: number;
}

export interface AdminReport {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_username: string;
  reviewer_username: string | null;
}

export interface AdminStats {
  users: { total: number; today: number; this_week: number };
  questions: number;
  answers: number;
  reports: { pending: number; total: number };
}

export async function getStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/api/admin/stats");
  return res.data;
}

export async function getAdminUsers(params: {
  q?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number; limit: number; offset: number }> {
  const res = await client.get("/api/admin/users", { params });
  return res.data;
}

export async function updateUserRole(
  id: string,
  role: "user" | "moderator" | "admin"
): Promise<void> {
  await client.patch(`/api/admin/users/${id}`, { role });
}

export async function getReports(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ reports: AdminReport[]; limit: number; offset: number }> {
  const res = await client.get("/api/admin/reports", { params });
  return res.data;
}

export async function actionReport(
  id: string,
  status: "reviewed" | "actioned"
): Promise<void> {
  await client.patch(`/api/admin/reports/${id}`, { status });
}
